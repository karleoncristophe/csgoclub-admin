import { useMemo, type ReactNode } from 'react'
import { ChevronsUpDown, PaintBucket, Shuffle } from 'lucide-react'
import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ListBox,
  ListBoxItem,
  Select,
  parseColor,
} from '@heroui/react'
import { useTheme } from '@/theme/ThemeContext'
import {
  COLOR_PRESETS,
  FONT_OPTIONS,
  RADIUS_SCALE,
  type ColorTheme,
  type FontId,
  type RadiusScale,
  type ThemeAppearance,
} from '@/theme/themeConfig'
import { formatOklch, hexToOklch, oklchToHex } from '@/theme/oklch'

const RADIUS_ORDER: RadiusScale[] = ['none', 'sm', 'md', 'lg', 'xl']
const PICKER_SWATCHES = COLOR_PRESETS.map((preset) => preset.hex)

function markCustom(appearance: ThemeAppearance): ThemeAppearance {
  return { ...appearance, preset: 'custom' }
}

function ColorWheelIcon() {
  return (
    <span
      aria-hidden
      className="block size-6 rounded-full ring-1 ring-white/25"
      style={{
        background:
          'conic-gradient(#f43f5e, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #f43f5e)',
      }}
    />
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-[13px] text-foreground">{children}</span>
}

function CompactSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string
  value: T
  options: Array<{ id: T; label: string }>
  onChange: (value: T) => void
  icon: ReactNode
}) {
  return (
    <div className="min-w-0">
      <FieldLabel>{label}</FieldLabel>
      <Select
        aria-label={label}
        className="w-full"
        selectedKey={value}
        onSelectionChange={(key) => {
          if (key != null) onChange(String(key) as T)
        }}
      >
        <Select.Trigger className="h-9 min-h-9 w-full gap-2 rounded-full border-0 bg-default px-3 text-sm text-foreground shadow-none [&_.select__indicator]:hidden">
          <span className="flex size-5 shrink-0 items-center justify-center text-[13px] font-medium text-muted">
            {icon}
          </span>
          <Select.Value className="min-w-0 flex-1 truncate text-left" />
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted" />
        </Select.Trigger>
        <Select.Popover className="min-w-40">
          <ListBox>
            {options.map((option) => (
              <ListBoxItem key={option.id} id={option.id} textValue={option.label}>
                {option.label}
                <ListBoxItem.Indicator />
              </ListBoxItem>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  )
}

export function ThemeControls() {
  const { appearance, setAppearance, setColorTheme } = useTheme()
  const accentHex = oklchToHex(
    appearance.accentLightness,
    appearance.accentChroma,
    appearance.accentHue,
  )
  const accentValue = useMemo(() => parseColor(accentHex), [accentHex])
  const baseStart = formatOklch(0.72, 0, appearance.accentHue)
  const baseEnd = formatOklch(0.45, 0.05, appearance.accentHue)
  const themeOptions = [
    ...COLOR_PRESETS.map((preset) => ({ id: preset.id as ColorTheme, label: preset.label })),
    ...(appearance.preset === 'custom' ? [{ id: 'custom' as const, label: 'Custom' }] : []),
  ]
  const radiusOptions = RADIUS_ORDER.map((id) => ({
    id,
    label: RADIUS_SCALE[id].hint,
  }))

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 rounded-2xl bg-background/95 px-4 py-3 text-foreground shadow-[0_8px_40px_rgb(0_0_0_/_0.45)] ring-1 ring-white/10 backdrop-blur-md">
      <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <FieldLabel>Accent</FieldLabel>
          <div className="flex h-9 items-center gap-2.5">
            <input
              type="range"
              min={0}
              max={360}
              step={0.1}
              value={appearance.accentHue}
              aria-label="Accent"
              className="theme-hue-slider min-w-0 flex-1 cursor-pointer appearance-none"
              onChange={(event) =>
                setAppearance((prev) => markCustom({ ...prev, accentHue: Number(event.target.value) }))
              }
            />
            <ColorPicker
              value={accentValue}
              onChange={(color) => {
                const next = hexToOklch(color.toString('hex'))
                setAppearance((prev) =>
                  markCustom({
                    ...prev,
                    accentLightness: next.l,
                    accentChroma: next.c,
                    accentHue: next.h,
                  }),
                )
              }}
            >
              <ColorPicker.Trigger
                aria-label="Abrir seletor de cor"
                className="size-6 shrink-0 rounded-full p-0"
              >
                <ColorWheelIcon />
              </ColorPicker.Trigger>
              <ColorPicker.Popover className="w-70 gap-2 p-3" placement="top">
                <ColorSwatchPicker className="justify-center" size="xs">
                  {PICKER_SWATCHES.map((hex) => (
                    <ColorSwatchPicker.Item key={hex} color={hex}>
                      <ColorSwatchPicker.Swatch />
                    </ColorSwatchPicker.Item>
                  ))}
                </ColorSwatchPicker>
                <ColorArea
                  aria-label="Saturação e brilho"
                  className="max-w-full"
                  colorSpace="hsb"
                  xChannel="saturation"
                  yChannel="brightness"
                >
                  <ColorArea.Thumb />
                </ColorArea>
                <div className="flex items-center gap-2 px-1">
                  <ColorSlider
                    aria-label="Hue"
                    channel="hue"
                    className="flex-1"
                    colorSpace="hsb"
                  >
                    <ColorSlider.Track className="h-2.5 rounded-full">
                      <ColorSlider.Thumb className="size-3.5 border-2 border-white bg-transparent shadow-md" />
                    </ColorSlider.Track>
                  </ColorSlider>
                  <Button
                    isIconOnly
                    aria-label="Cor aleatória"
                    size="sm"
                    variant="tertiary"
                    onPress={() => {
                      const hue = Math.floor(Math.random() * 360)
                      const saturation = 50 + Math.floor(Math.random() * 50)
                      const lightness = 40 + Math.floor(Math.random() * 30)
                      const next = hexToOklch(
                        parseColor(`hsl(${hue} ${saturation}% ${lightness}%)`).toString('hex'),
                      )
                      setAppearance((prev) =>
                        markCustom({
                          ...prev,
                          accentLightness: next.l,
                          accentChroma: next.c,
                          accentHue: next.h,
                        }),
                      )
                    }}
                  >
                    <Shuffle className="size-4" />
                  </Button>
                </div>
                <ColorField aria-label="Hex">
                  <ColorField.Group variant="secondary">
                    <ColorField.Prefix>
                      <ColorSwatch size="xs" />
                    </ColorField.Prefix>
                    <ColorField.Input />
                  </ColorField.Group>
                </ColorField>
              </ColorPicker.Popover>
            </ColorPicker>
          </div>
        </div>

        <div className="min-w-0">
          <FieldLabel>Base</FieldLabel>
          <div className="flex h-9 items-center">
            <input
              type="range"
              min={0}
              max={0.05}
              step={0.0005}
              value={appearance.baseChroma}
              aria-label="Base"
              className="theme-slider w-full min-w-0 cursor-pointer appearance-none"
              style={{ background: `linear-gradient(to right, ${baseStart}, ${baseEnd})` }}
              onChange={(event) =>
                setAppearance((prev) => markCustom({ ...prev, baseChroma: Number(event.target.value) }))
              }
            />
          </div>
        </div>

        <CompactSelect
          label="Font Family"
          icon={<span className="text-[11px] tracking-tight">Aa</span>}
          value={appearance.fontId}
          options={FONT_OPTIONS.map((font) => ({ id: font.id, label: font.label }))}
          onChange={(fontId: FontId) => setAppearance((prev) => ({ ...prev, fontId }))}
        />

        <CompactSelect
          label="Radius"
          icon={RADIUS_SCALE[appearance.radius].label}
          value={appearance.radius}
          options={radiusOptions}
          onChange={(radius: RadiusScale) => setAppearance((prev) => ({ ...prev, radius }))}
        />
        <CompactSelect
          label="Radius Form"
          icon={RADIUS_SCALE[appearance.fieldRadius].label}
          value={appearance.fieldRadius}
          options={radiusOptions}
          onChange={(fieldRadius: RadiusScale) => setAppearance((prev) => ({ ...prev, fieldRadius }))}
        />
        <CompactSelect
          label="Theme"
          icon={<PaintBucket className="size-3.5" />}
          value={appearance.preset}
          options={themeOptions}
          onChange={(preset) => {
            if (preset === 'custom') return
            setColorTheme(preset)
          }}
        />
      </div>
    </div>
  )
}
