import { CaseEditorDevPresetBar } from '@/components/cases/editor/CaseEditorDevPresetBar'
import { CaseEditorInfluencerDemoPresetBar } from '@/components/cases/editor/CaseEditorInfluencerDemoPresetBar'
import { CaseEditorJapaSkinsPresetBar } from '@/components/cases/editor/CaseEditorJapaSkinsPresetBar'
import { Modal } from '@/components/ui/Modal'

type PresetState = {
  loading: boolean
  error: string | null
  onApply: () => void
}

type CaseEditorPresetsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetMarginPercent: number
  discountPercent: number
  dev: PresetState
  japaSkins: PresetState
  influencerDemo: PresetState
}

export function CaseEditorPresetsModal({
  open,
  onOpenChange,
  targetMarginPercent,
  discountPercent,
  dev,
  japaSkins,
  influencerDemo,
}: CaseEditorPresetsModalProps) {
  const applyAndClose = (apply: () => void) => () => {
    apply()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Presets de caixa"
      description="Preenche nome, itens, chances e preços de uma vez. Você ainda pode ajustar tudo depois."
      size="xl"
    >
      <div className="space-y-4">
        <CaseEditorJapaSkinsPresetBar
          loading={japaSkins.loading}
          error={japaSkins.error}
          targetMarginPercent={targetMarginPercent}
          discountPercent={discountPercent}
          onApply={applyAndClose(japaSkins.onApply)}
        />
        <CaseEditorInfluencerDemoPresetBar
          loading={influencerDemo.loading}
          error={influencerDemo.error}
          onApply={applyAndClose(influencerDemo.onApply)}
        />
        <CaseEditorDevPresetBar
          loading={dev.loading}
          error={dev.error}
          targetMarginPercent={targetMarginPercent}
          discountPercent={discountPercent}
          onApply={applyAndClose(dev.onApply)}
        />
      </div>
    </Modal>
  )
}
