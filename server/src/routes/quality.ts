import express from 'express';
import { authenticate } from '../middleware/auth';
import { QualityCheck, Certification, ComplianceStandard } from '../models/Quality';
import Spare from '../models/Spare';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all quality checks for a spare
router.get('/checks/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const checks = await QualityCheck.find({ spareId })
      .sort({ date: -1 });
    
    res.json(checks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quality checks', error: error.message });
  }
});

// Create a new quality check
router.post('/checks', async (req, res) => {
  try {
    const {
      spareId,
      date,
      inspector,
      grade,
      score,
      parameters,
      notes,
      images,
      status,
      nextCheckDate
    } = req.body;

    const check = new QualityCheck({
      spareId,
      date,
      inspector,
      grade,
      score,
      parameters,
      notes,
      images,
      status,
      nextCheckDate,
      companyId: req.user.companyId
    });

    await check.save();

    // Update the spare's quality information
    await Spare.findByIdAndUpdate(spareId, {
      'quality.qualityGrade': grade,
      'quality.lastQualityCheck': date,
      'quality.qualityNotes': notes
    });

    res.status(201).json(check);
  } catch (error) {
    res.status(500).json({ message: 'Error creating quality check', error: error.message });
  }
});

// Update a quality check
router.put('/checks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const check = await QualityCheck.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!check) {
      return res.status(404).json({ message: 'Quality check not found' });
    }

    res.json(check);
  } catch (error) {
    res.status(500).json({ message: 'Error updating quality check', error: error.message });
  }
});

// Delete a quality check
router.delete('/checks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const check = await QualityCheck.findByIdAndDelete(id);

    if (!check) {
      return res.status(404).json({ message: 'Quality check not found' });
    }

    res.json({ message: 'Quality check deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quality check', error: error.message });
  }
});

// Get all certifications for a spare
router.get('/certifications/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const certifications = await Certification.find({ spareId })
      .sort({ issueDate: -1 });
    
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certifications', error: error.message });
  }
});

// Create a new certification
router.post('/certifications', async (req, res) => {
  try {
    const {
      spareId,
      name,
      issuingAuthority,
      issueDate,
      expiryDate,
      certificateNumber,
      status,
      documentUrl,
      notes
    } = req.body;

    const certification = new Certification({
      spareId,
      name,
      issuingAuthority,
      issueDate,
      expiryDate,
      certificateNumber,
      status,
      documentUrl,
      notes,
      companyId: req.user.companyId
    });

    await certification.save();
    res.status(201).json(certification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating certification', error: error.message });
  }
});

// Update a certification
router.put('/certifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const certification = await Certification.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    res.json(certification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating certification', error: error.message });
  }
});

// Delete a certification
router.delete('/certifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const certification = await Certification.findByIdAndDelete(id);

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting certification', error: error.message });
  }
});

// Get all compliance standards for a spare
router.get('/compliance/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const standards = await ComplianceStandard.find({ spareId })
      .sort({ name: 1 });
    
    res.json(standards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching compliance standards', error: error.message });
  }
});

// Create a new compliance standard
router.post('/compliance', async (req, res) => {
  try {
    const {
      spareId,
      name,
      code,
      description,
      status,
      lastAuditDate,
      nextAuditDate,
      auditNotes
    } = req.body;

    const standard = new ComplianceStandard({
      spareId,
      name,
      code,
      description,
      status,
      lastAuditDate,
      nextAuditDate,
      auditNotes,
      companyId: req.user.companyId
    });

    await standard.save();
    res.status(201).json(standard);
  } catch (error) {
    res.status(500).json({ message: 'Error creating compliance standard', error: error.message });
  }
});

// Update a compliance standard
router.put('/compliance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const standard = await ComplianceStandard.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!standard) {
      return res.status(404).json({ message: 'Compliance standard not found' });
    }

    res.json(standard);
  } catch (error) {
    res.status(500).json({ message: 'Error updating compliance standard', error: error.message });
  }
});

// Delete a compliance standard
router.delete('/compliance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const standard = await ComplianceStandard.findByIdAndDelete(id);

    if (!standard) {
      return res.status(404).json({ message: 'Compliance standard not found' });
    }

    res.json({ message: 'Compliance standard deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting compliance standard', error: error.message });
  }
});

// Get quality analytics for a spare
router.get('/analytics/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    
    const checks = await QualityCheck.find({ spareId });
    const certifications = await Certification.find({ spareId });
    const standards = await ComplianceStandard.find({ spareId });

    // Calculate analytics
    const totalChecks = checks.length;
    const completedChecks = checks.filter(c => c.status === 'completed').length;
    const efficiency = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
    
    const averageScore = totalChecks > 0 ? 
      Math.round(checks.reduce((sum, c) => sum + (c.score || 0), 0) / totalChecks) : 0;

    // Grade distribution
    const gradeDistribution = {
      'A+': checks.filter(c => c.grade === 'A+').length,
      'A': checks.filter(c => c.grade === 'A').length,
      'B+': checks.filter(c => c.grade === 'B+').length,
      'B': checks.filter(c => c.grade === 'B').length,
      'C': checks.filter(c => c.grade === 'C').length,
      'Reject': checks.filter(c => c.grade === 'Reject').length
    };

    // Certification status
    const certificationStatus = {
      active: certifications.filter(c => c.status === 'active').length,
      pending: certifications.filter(c => c.status === 'pending').length,
      expired: certifications.filter(c => c.status === 'expired').length,
      suspended: certifications.filter(c => c.status === 'suspended').length
    };

    // Compliance status
    const complianceStatus = {
      compliant: standards.filter(s => s.status === 'compliant').length,
      nonCompliant: standards.filter(s => s.status === 'non-compliant').length,
      pending: standards.filter(s => s.status === 'pending').length,
      exempt: standards.filter(s => s.status === 'exempt').length
    };

    // Quality trend
    let qualityTrend = 'stable';
    if (checks.length >= 2) {
      const recent = checks[0].score;
      const previous = checks[1].score;
      if (recent > previous) qualityTrend = 'improving';
      else if (recent < previous) qualityTrend = 'declining';
    }

    res.json({
      totalChecks,
      completedChecks,
      efficiency,
      averageScore,
      gradeDistribution,
      certificationStatus,
      complianceStatus,
      qualityTrend
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quality analytics', error: error.message });
  }
});

// Get quality checks due soon
router.get('/checks-due/:days', async (req, res) => {
  try {
    const { days } = req.params;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));

    const checks = await QualityCheck.find({
      companyId: req.user.companyId,
      nextCheckDate: {
        $gte: new Date(),
        $lte: dueDate
      }
    }).populate('spareId', 'spareName spareCode');

    res.json(checks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quality checks due soon', error: error.message });
  }
});

// Get expired certifications
router.get('/certifications-expired', async (req, res) => {
  try {
    const certifications = await Certification.find({
      companyId: req.user.companyId,
      status: 'active',
      expiryDate: { $lt: new Date() }
    }).populate('spareId', 'spareName spareCode');

    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expired certifications', error: error.message });
  }
});

// Get certifications expiring soon
router.get('/certifications-expiring/:days', async (req, res) => {
  try {
    const { days } = req.params;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const certifications = await Certification.find({
      companyId: req.user.companyId,
      status: 'active',
      expiryDate: {
        $gte: new Date(),
        $lte: expiryDate
      }
    }).populate('spareId', 'spareName spareCode');

    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certifications expiring soon', error: error.message });
  }
});

// Get quality statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const totalChecks = await QualityCheck.countDocuments({ companyId });
    const completedChecks = await QualityCheck.countDocuments({ 
      companyId, 
      status: 'completed' 
    });
    
    const totalCertifications = await Certification.countDocuments({ companyId });
    const activeCertifications = await Certification.countDocuments({ 
      companyId, 
      status: 'active' 
    });

    const totalStandards = await ComplianceStandard.countDocuments({ companyId });
    const compliantStandards = await ComplianceStandard.countDocuments({
      companyId,
      status: 'compliant'
    });

    const checksDueSoon = await QualityCheck.countDocuments({
      companyId,
      nextCheckDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
      }
    });

    const expiredCertifications = await Certification.countDocuments({
      companyId,
      status: 'active',
      expiryDate: { $lt: new Date() }
    });

    res.json({
      totalChecks,
      completedChecks,
      totalCertifications,
      activeCertifications,
      totalStandards,
      compliantStandards,
      checksDueSoon,
      expiredCertifications
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quality statistics', error: error.message });
  }
});

export default router;
