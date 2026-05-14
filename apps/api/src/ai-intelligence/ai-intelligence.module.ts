import { Module, OnModuleInit } from '@nestjs/common';
import { AIIntelligenceController } from './ai-intelligence.controller';
import { AIIntelligenceService } from './ai-intelligence.service';
import { AiDataService } from './ai-data.service';
import { TaskAgent } from './agents/task.agent';
import { PropertySearchAgent } from './agents/property-search.agent';
import { PropertyValuationAgent } from './agents/property-valuation.agent';
import { RankingAgent } from './agents/ranking.agent';
import { BuyerProfileAgent } from './agents/buyer-profile.agent';
import { BuyerMatchAgent } from './agents/buyer-match.agent';
import { DemandAnalysisAgent } from './agents/demand-analysis.agent';
import { OfferAnalysisAgent } from './agents/offer-analysis.agent';
import { NegotiationAgent } from './agents/negotiation.agent';
import { NotificationAgent } from './agents/notification.agent';
import { DocumentAgent } from './agents/document.agent';
import { WorkflowAgent } from './agents/workflow.agent';
import { AgentRegistryService, AI_AGENTS_TOKEN } from './registry/agent-registry.service';
import { AgentMemoryService } from './memory/agent-memory.service';
import { AiObservabilityService } from './observability/ai-observability.service';
import { AiGuardrailsService } from './guardrails/ai-guardrails.service';
import { QueryPlannerService } from './orchestrator/query-planner.service';
import { WorkflowOrchestratorService } from './orchestrator/workflow-orchestrator.service';
import { BaseAgent } from './agents/base.agent';
import { LlmGatewayService } from './llm/llm-gateway.service';

@Module({
  controllers: [AIIntelligenceController],
  providers: [
    // Core service
    AiDataService,
    AIIntelligenceService,

    // Agent workforce (11 agents total)
    TaskAgent,
    PropertySearchAgent,
    PropertyValuationAgent,
    RankingAgent,
    BuyerProfileAgent,
    BuyerMatchAgent,
    DemandAnalysisAgent,
    OfferAnalysisAgent,
    NegotiationAgent,
    NotificationAgent,
    DocumentAgent,
    WorkflowAgent,

    // Agent injection token — array of all registered agents
    {
      provide: AI_AGENTS_TOKEN,
      useFactory: (
        task: TaskAgent,
        propertySearch: PropertySearchAgent,
        propertyValuation: PropertyValuationAgent,
        ranking: RankingAgent,
        buyerProfile: BuyerProfileAgent,
        buyerMatch: BuyerMatchAgent,
        demandAnalysis: DemandAnalysisAgent,
        offerAnalysis: OfferAnalysisAgent,
        negotiation: NegotiationAgent,
        notification: NotificationAgent,
        document: DocumentAgent,
        workflow: WorkflowAgent,
      ): BaseAgent[] => [
        task, propertySearch, propertyValuation, ranking,
        buyerProfile, buyerMatch, demandAnalysis, offerAnalysis,
        negotiation, notification, document, workflow,
      ],
      inject: [
        TaskAgent, PropertySearchAgent, PropertyValuationAgent, RankingAgent,
        BuyerProfileAgent, BuyerMatchAgent, DemandAnalysisAgent, OfferAnalysisAgent,
        NegotiationAgent, NotificationAgent, DocumentAgent, WorkflowAgent,
      ],
    },

    // Infrastructure layers
    AgentRegistryService,
    AgentMemoryService,
    AiObservabilityService,
    AiGuardrailsService,
    QueryPlannerService,
    WorkflowOrchestratorService,
    LlmGatewayService,
  ],
  exports: [
    AIIntelligenceService,
    AiObservabilityService,
    AgentRegistryService,
    WorkflowOrchestratorService,
  ],
})
export class AIIntelligenceModule implements OnModuleInit {
  constructor(
    private readonly orchestrator: WorkflowOrchestratorService,
    private readonly aiService: AIIntelligenceService,
  ) {}

  /**
   * Wire the fallback delegate after all providers are constructed.
   * This breaks the circular dependency between WorkflowOrchestratorService
   * and AIIntelligenceService.
   */
  onModuleInit(): void {
    this.orchestrator.setFallbackDelegate(
      (userId, companyId, query, pageContext) =>
        this.aiService.queryAssistant(userId, companyId, query, pageContext),
    );
  }
}

