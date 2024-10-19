module.exports = {
  request_status: {
    // initial state
    NEW: 'new',
    // at least one of the stores has created a quote
    IN_PROGRESS: 'in_progress',
    // car owner has accepted a quote
    COMPLETED: 'completed',
    // car owner has canceled the request
    CANCELED: 'canceled'
  }
}
