import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiArrowLeft, FiImage, FiCalendar, FiMapPin, FiDollarSign, FiTag, FiInfo } from 'react-icons/fi';
import eventService from '../../services/eventService';
import { motion } from 'framer-motion';

const EventForm = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    category: '',
    image: '',
    ticketTypes: [
      {
        name: 'General Admission',
        price: '',
        quantity: '',
        description: ''
      }
    ]
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch event data if editing
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(eventId),
    enabled: isEditing && !!eventId,
    select: (data) => data.data,
    onSuccess: (data) => {
      if (data) {
        // Format date and time for form inputs
        const eventDate = new Date(data.date);
        const formattedDate = eventDate.toISOString().split('T')[0];
        const formattedTime = eventDate.toTimeString().split(' ')[0].substring(0, 5);
        
        setFormData({
          title: data.title || '',
          description: data.description || '',
          date: formattedDate || '',
          time: formattedTime || '',
          location: data.location || '',
          venue: data.venue || '',
          category: data.category || '',
          image: data.image || '',
          ticketTypes: data.ticketTypes?.length > 0 
            ? data.ticketTypes.map(ticket => ({
                name: ticket.name || '',
                price: ticket.price || '',
                quantity: ticket.quantity || '',
                description: ticket.description || ''
              }))
            : [
                {
                  name: 'General Admission',
                  price: '',
                  quantity: '',
                  description: ''
                }
              ]
        });
        
        if (data.image) {
          setImagePreview(data.image);
        }
      }
    }
  });
  
  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (data) => eventService.createEvent(data),
    onSuccess: async (response) => {
      // Upload image if available
      if (imageFile && response.data?._id) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await eventService.uploadEventImage(response.data._id, formData);
      }
      
      queryClient.invalidateQueries(['userEvents']);
      navigate('/dashboard/events');
    }
  });
  
  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => eventService.updateEvent(id, data),
    onSuccess: async (response) => {
      // Upload image if available
      if (imageFile && eventId) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await eventService.uploadEventImage(eventId, formData);
      }
      
      queryClient.invalidateQueries(['userEvents']);
      queryClient.invalidateQueries(['event', eventId]);
      navigate('/dashboard/events');
    }
  });
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle ticket type change
  const handleTicketChange = (index, e) => {
    const { name, value } = e.target;
    const updatedTickets = [...formData.ticketTypes];
    updatedTickets[index] = {
      ...updatedTickets[index],
      [name]: value
    };
    
    setFormData(prev => ({
      ...prev,
      ticketTypes: updatedTickets
    }));
  };
  
  // Add ticket type
  const addTicketType = () => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: [
        ...prev.ticketTypes,
        {
          name: '',
          price: '',
          quantity: '',
          description: ''
        }
      ]
    }));
  };
  
  // Remove ticket type
  const removeTicketType = (index) => {
    if (formData.ticketTypes.length > 1) {
      const updatedTickets = [...formData.ticketTypes];
      updatedTickets.splice(index, 1);
      
      setFormData(prev => ({
        ...prev,
        ticketTypes: updatedTickets
      }));
    }
  };
  
  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.category) newErrors.category = 'Category is required';
    
    // Validate ticket types
    const ticketErrors = [];
    formData.ticketTypes.forEach((ticket, index) => {
      const ticketError = {};
      if (!ticket.name) ticketError.name = 'Name is required';
      if (!ticket.price) ticketError.price = 'Price is required';
      if (!ticket.quantity) ticketError.quantity = 'Quantity is required';
      
      if (Object.keys(ticketError).length > 0) {
        ticketErrors[index] = ticketError;
      }
    });
    
    if (ticketErrors.length > 0) {
      newErrors.ticketTypes = ticketErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: eventDateTime.toISOString(),
        location: formData.location,
        venue: formData.venue,
        category: formData.category,
        ticketTypes: formData.ticketTypes
      };
      
      if (isEditing) {
        await updateEventMutation.mutateAsync({ id: eventId, data: eventData });
      } else {
        await createEventMutation.mutateAsync(eventData);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to save event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard/events')}
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <FiArrowLeft className="mr-2" />
              Back to Events
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </h1>
          </div>
          
          {eventLoading && isEditing ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Details */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Details</h2>
                
                <div className="space-y-4">
                  {/* Event Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Event Title*
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                        errors.title ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter event title"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>
                  
                  {/* Event Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description*
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                        errors.description ? 'border-red-500' : ''
                      }`}
                      placeholder="Describe your event"
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>
                  
                  {/* Event Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category*
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                        errors.category ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select a category</option>
                      <option value="music">Music</option>
                      <option value="conference">Conference</option>
                      <option value="workshop">Workshop</option>
                      <option value="sports">Sports</option>
                      <option value="arts">Arts & Theater</option>
                      <option value="food">Food & Drink</option>
                      <option value="charity">Charity</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                  </div>
                  
                  {/* Event Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Event Image
                    </label>
                    <div className="mt-1 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Event preview"
                            className="h-32 w-32 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-32 w-32 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <FiImage className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <FiImage className="mr-2 -ml-1 h-5 w-5" />
                          {imagePreview ? 'Change Image' : 'Upload Image'}
                        </label>
                        <input
                          id="image-upload"
                          name="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Recommended size: 1200x600 pixels
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Date, Time & Location */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Date, Time & Location</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Date */}
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date*
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                          errors.date ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                  </div>
                  
                  {/* Event Time */}
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time*
                    </label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                        errors.time ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
                  </div>
                  
                  {/* Event Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location*
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                          errors.location ? 'border-red-500' : ''
                        }`}
                        placeholder="City, State"
                      />
                    </div>
                    {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                  </div>
                  
                  {/* Event Venue */}
                  <div>
                    <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Venue
                    </label>
                    <input
                      type="text"
                      id="venue"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="Venue name"
                    />
                  </div>
                </div>
              </div>
              
              {/* Ticket Types */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ticket Types</h2>
                  <button
                    type="button"
                    onClick={addTicketType}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-300 dark:bg-primary-900 dark:hover:bg-primary-800"
                  >
                    Add Ticket Type
                  </button>
                </div>
                
                <div className="space-y-6">
                  {formData.ticketTypes.map((ticket, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Ticket Type #{index + 1}
                        </h3>
                        {formData.ticketTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTicketType(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ticket Name */}
                        <div>
                          <label htmlFor={`ticket-name-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ticket Name*
                          </label>
                          <input
                            type="text"
                            id={`ticket-name-${index}`}
                            name="name"
                            value={ticket.name}
                            onChange={(e) => handleTicketChange(index, e)}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                              errors.ticketTypes?.[index]?.name ? 'border-red-500' : ''
                            }`}
                            placeholder="e.g., General Admission, VIP"
                          />
                          {errors.ticketTypes?.[index]?.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.ticketTypes[index].name}</p>
                          )}
                        </div>
                        
                        {/* Ticket Price */}
                        <div>
                          <label htmlFor={`ticket-price-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Price*
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiDollarSign className="text-gray-400" />
                            </div>
                            <input
                              type="number"
                              id={`ticket-price-${index}`}
                              name="price"
                              value={ticket.price}
                              onChange={(e) => handleTicketChange(index, e)}
                              min="0"
                              step="0.01"
                              className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                                errors.ticketTypes?.[index]?.price ? 'border-red-500' : ''
                              }`}
                              placeholder="0.00"
                            />
                          </div>
                          {errors.ticketTypes?.[index]?.price && (
                            <p className="mt-1 text-sm text-red-600">{errors.ticketTypes[index].price}</p>
                          )}
                        </div>
                        
                        {/* Ticket Quantity */}
                        <div>
                          <label htmlFor={`ticket-quantity-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Quantity Available*
                          </label>
                          <input
                            type="number"
                            id={`ticket-quantity-${index}`}
                            name="quantity"
                            value={ticket.quantity}
                            onChange={(e) => handleTicketChange(index, e)}
                            min="1"
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                              errors.ticketTypes?.[index]?.quantity ? 'border-red-500' : ''
                            }`}
                            placeholder="Number of tickets available"
                          />
                          {errors.ticketTypes?.[index]?.quantity && (
                            <p className="mt-1 text-sm text-red-600">{errors.ticketTypes[index].quantity}</p>
                          )}
                        </div>
                        
                        {/* Ticket Description */}
                        <div>
                          <label htmlFor={`ticket-description-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </label>
                          <input
                            type="text"
                            id={`ticket-description-${index}`}
                            name="description"
                            value={ticket.description}
                            onChange={(e) => handleTicketChange(index, e)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="Optional description"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Form Error */}
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
                  <span className="block sm:inline">{errors.submit}</span>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2 -ml-1" />
                      {isEditing ? 'Update Event' : 'Create Event'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EventForm; 