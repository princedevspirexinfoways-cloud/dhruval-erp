import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { S3Service } from '../../services/S3Service';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

const router = Router();
const s3Service = new S3Service();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/file-access/view-url
 * @desc    Generate presigned URL for viewing a file
 * @access  Private
 */
router.post('/view-url', async (req, res) => {
  try {
    const { fileKey, expiresIn = 3600 } = req.body;
    const userId = (req.user?.userId || req.user?._id)?.toString();

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'File key is required'
      });
    }

    // Generate presigned URL for viewing
    const viewUrl = await s3Service.generateViewUrl(fileKey, expiresIn);

    logger.info('Generated view URL', {
      fileKey,
      userId,
      expiresIn
    });

    res.json({
      success: true,
      data: {
        viewUrl,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      },
      message: 'View URL generated successfully'
    });
  } catch (error) {
    logger.error('Error generating view URL', { error, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Failed to generate view URL'
    });
  }
});

/**
 * @route   GET /api/v1/file-access/:fileKey
 * @desc    Redirect to presigned URL for viewing a file
 * @access  Private
 */
router.get('/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const { expiresIn = 3600 } = req.query;
    const userId = (req.user?.userId || req.user?._id)?.toString();

    // Generate presigned URL for viewing
    const viewUrl = await s3Service.generateViewUrl(fileKey, parseInt(expiresIn as string));

    logger.info('Redirecting to view URL', {
      fileKey,
      userId,
      expiresIn
    });

    // Redirect to the presigned URL
    res.redirect(viewUrl);
  } catch (error) {
    logger.error('Error redirecting to view URL', { error, params: req.params });
    res.status(500).json({
      success: false,
      message: 'Failed to access file'
    });
  }
});

export default router;
