// ThreatSense — AgentPipeline
// Visual representation of the live agent processing pipeline

export function AgentPipeline({ agents = [], pipeline = null }) {
  const processingAgent = agents.find((agent) => agent.status === 'processing')

  return (
    <div className="card mb-6">
      <h3 className="font-semibold text-brown-primary mb-6">Processing Pipeline</h3>

      {/* Pipeline visualization */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-max px-4">
          {/* LOG IN */}
          <div className="text-center">
            <div className="border-2 border-dashed border-border bg-beige px-4 py-2 rounded-lg text-xs font-medium text-brown-secondary">
              LOG IN
            </div>
          </div>

          {/* Arrow */}
          <div className="text-brown-secondary font-bold">→→</div>

          {/* SUPERVISOR */}
          <div className="text-center">
            <div className="bg-sidebar text-cream px-4 py-3 rounded-lg text-xs font-bold shadow-md">
              SUPERVISOR
            </div>
          </div>

          {/* Arrow */}
          <div className="text-brown-secondary font-bold">→→→</div>

          {/* Agents */}
          <div className="flex flex-col gap-3">
            {agents.map((agent) => (
              <div key={agent.key} className="text-center">
                <div
                  className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-all ${
                    agent.status === 'processing'
                      ? 'bg-orange-DEFAULT animate-pulse ring-2 ring-orange-300'
                      : 'bg-brown-primary'
                  }`}
                >
                  {agent.name.split(' ')[0].toUpperCase()} AGENT
                </div>
              </div>
            ))}
          </div>

          {/* Arrow down/right */}
          <div className="text-brown-secondary font-bold">→→</div>

          {/* EXPLAINER */}
          <div className="text-center">
            <div className="bg-orange-tint border-2 border-orange-DEFAULT text-orange-DEFAULT px-4 py-3 rounded-lg text-xs font-bold">
              EXPLAINER
            </div>
          </div>

          {/* Arrow */}
          <div className="text-brown-secondary font-bold">→→</div>

          {/* ALERT OUT */}
          <div className="text-center">
            <div className="border-2 border-dashed border-border bg-beige px-4 py-2 rounded-lg text-xs font-medium text-brown-secondary">
              ALERT OUT
            </div>
          </div>
        </div>
      </div>

      {/* Status message */}
      {processingAgent && (
        <div className="mt-4 text-sm text-orange-DEFAULT font-semibold">
          🔄 {processingAgent.name} is currently processing...
        </div>
      )}

      {!processingAgent && (
        <div className="mt-4 text-sm text-brown-secondary font-medium">
          Pipeline idle. Last completed stage: {pipeline?.stages?.[pipeline.stages.length - 1] || 'alert'}.
        </div>
      )}
    </div>
  )
}
