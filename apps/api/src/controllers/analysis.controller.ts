import type { Request, Response, NextFunction } from 'express';
import type { IAnalysisService } from '../interfaces/services/IAnalysisService';
import { ResponseFactory } from '../utils/response.factory';
import { getAuditService, AuditAction } from '../services/audit.service';

export class AnalysisController {
  constructor(private readonly analysisService: IAnalysisService) {}

  analyze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const analysis = await this.analysisService.analyzeSubmission(id);

      getAuditService().log({
        userId: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        action: analysis.errorFlag ? AuditAction.AI_ANALYSIS_FAILED : AuditAction.AI_ANALYSIS_TRIGGERED,
        entityType: 'submission',
        entityId: id,
        success: !analysis.errorFlag,
        req,
      });

      const { status, body } = ResponseFactory.success(
        analysis,
        analysis.errorFlag ? 'Analysis failed — fallback returned' : 'Analysis complete'
      );
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };
}
