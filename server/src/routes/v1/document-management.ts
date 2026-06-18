import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();
// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/document-management
 * @desc    Get documents by company
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentsByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management
 * @desc    Create new document
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.createDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/document-management/:id
 * @desc    Update document
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.updateDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/document-management/:id
 * @desc    Delete document (soft delete)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.deleteDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/type/:documentType
 * @desc    Get documents by type
 * @access  Private
 */
router.get('/type/:documentType', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentsByType(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/category/:category
 * @desc    Get documents by category
 * @access  Private
 */
router.get('/category/:category', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentsByCategory(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/pending-approval
 * @desc    Get documents pending approval
 * @access  Private
 */
router.get('/pending-approval', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getPendingApproval(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/overdue-approvals
 * @desc    Get overdue approvals
 * @access  Private
 */
router.get('/overdue-approvals', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getOverdueApprovals(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/upload
 * @desc    Upload document file
 * @access  Private
 */
router.post('/:id/upload', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.uploadDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/version
 * @desc    Add new version to document
 * @access  Private
 */
router.post('/:id/version', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.addVersion(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/:id/versions
 * @desc    Get document versions
 * @access  Private
 */
router.get('/:id/versions', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentVersions(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/approval
 * @desc    Request document approval
 * @access  Private
 */
router.post('/:id/approval', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.requestApproval(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/document-management/:id/approve
 * @desc    Approve document
 * @access  Private
 */
router.put('/:id/approve', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.approveDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/document-management/:id/reject
 * @desc    Reject document
 * @access  Private
 */
router.put('/:id/reject', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.rejectDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/access
 * @desc    Grant access to document
 * @access  Private
 */
router.post('/:id/access', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.grantAccess(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/document-management/:id/access/:userId
 * @desc    Revoke access to document
 * @access  Private
 */
router.delete('/:id/access/:userId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.revokeAccess(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/:id/access
 * @desc    Get document access list
 * @access  Private
 */
router.get('/:id/access', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentAccess(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/view
 * @desc    Record document view
 * @access  Private
 */
router.post('/:id/view', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.recordView(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/download
 * @desc    Record document download
 * @access  Private
 */
router.post('/:id/download', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.recordDownload(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/:id/analytics
 * @desc    Get document analytics
 * @access  Private
 */
router.get('/:id/analytics', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentAnalytics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/search
 * @desc    Search documents
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.searchDocuments(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/process
 * @desc    Process document (OCR, auto-tagging, etc.)
 * @access  Private
 */
router.post('/:id/process', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.processDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/:id/preview
 * @desc    Get document preview
 * @access  Private
 */
router.get('/:id/preview', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentPreview(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/document-management/:id/thumbnail
 * @desc    Get document thumbnail
 * @access  Private
 */
router.get('/:id/thumbnail', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.getDocumentThumbnail(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/:id/share
 * @desc    Share document
 * @access  Private
 */
router.post('/:id/share', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.shareDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/document-management/:id/archive
 * @desc    Archive document
 * @access  Private
 */
router.put('/:id/archive', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.archiveDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/document-management/:id/restore
 * @desc    Restore archived document
 * @access  Private
 */
router.put('/:id/restore', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.restoreDocument(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/bulk-upload
 * @desc    Bulk upload documents
 * @access  Private
 */
router.post('/bulk-upload', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.bulkUpload(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/document-management/bulk-approve
 * @desc    Bulk approve documents
 * @access  Private
 */
router.post('/bulk-approve', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { DocumentManagementController } = await import('../../controllers/DocumentManagementController');
    const documentManagementController = new DocumentManagementController();
    await documentManagementController.bulkApprove(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
