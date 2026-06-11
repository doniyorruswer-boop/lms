// Complaints feature exports

// Components
export { default as ComplaintsPage } from './components/complaints-page'
export { default as ComplaintForm } from './components/complaint-form'
export { default as ComplaintHistory } from './components/complaint-history'

// API hooks
export * from './api/use-complaints'

// Validation and schemas
export * from './lib/complaint-validation'
export * from './lib/complaint-schema'