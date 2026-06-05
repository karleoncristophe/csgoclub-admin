type WeaponTypeBucket =
  | 'Rifle'
  | 'Sniper'
  | 'SMG'
  | 'Pistol'
  | 'Shotgun'
  | 'Machinegun'
  | 'Knife'
  | 'Gloves'
  | 'Other'

const WEAPON_BUCKETS: Record<WeaponTypeBucket, readonly string[]> = {
  Rifle: ['AK-47', 'M4A1-S', 'M4A4', 'FAMAS', 'GALIL AR', 'SG 553', 'AUG'],
  Sniper: ['AWP', 'SSG 08', 'SCAR-20', 'G3SG1'],
  SMG: ['MAC-10', 'MP9', 'MP7', 'MP5-SD', 'UMP-45', 'P90', 'PP-BIZON'],
  Pistol: ['GLOCK-18', 'USP-S', 'P2000', 'P250', 'CZ75-AUTO', 'FIVE-SEVEN', 'TEC-9', 'DUAL BERETTAS', 'DESERT EAGLE', 'R8 REVOLVER'],
  Shotgun: ['XM1014', 'MAG-7', 'NOVA', 'SAWED-OFF'],
  Machinegun: ['M249', 'NEGEV'],
  Knife: ['KNIFE', 'BAYONET', 'KARAMBIT', 'M9 BAYONET', 'FLIP KNIFE', 'HUNTSMAN KNIFE', 'BOWIE KNIFE', 'FALCHION KNIFE', 'NAVAJA KNIFE', 'STILETTO KNIFE', 'URSUS KNIFE', 'TALON KNIFE', 'SKELETON KNIFE', 'PARACORD KNIFE', 'SURVIVAL KNIFE', 'CLASSIC KNIFE', 'SHADOW DAGGERS', 'GUT KNIFE', 'BUTTERFLY KNIFE'],
  Gloves: ['GLOVES', 'HAND WRAPS', 'BLOODHOUND GLOVES', 'DRIVER GLOVES', 'SPECIALIST GLOVES', 'SPORT GLOVES', 'MOTO GLOVES', 'HYDRA GLOVES'],
  Other: [],
}

const weaponToBucketMap = new Map<string, WeaponTypeBucket>(
  Object.entries(WEAPON_BUCKETS).flatMap(([bucket, weapons]) =>
    weapons.map((weapon) => [weapon.toUpperCase(), bucket as WeaponTypeBucket]),
  ),
)

function normalizeWeaponToken(name: string) {
  const [raw] = name.split('|')
  return raw?.trim().toUpperCase() ?? ''
}

export function getSkinWeaponName(name: string): string {
  const [raw] = name.split('|')
  return (raw?.trim() || 'Unknown').toUpperCase()
}

export function getSkinWeaponType(name: string): WeaponTypeBucket {
  const weaponToken = normalizeWeaponToken(name)

  const direct = weaponToBucketMap.get(weaponToken)
  if (direct) return direct

  if (weaponToken.includes('KNIFE')) return 'Knife'
  if (weaponToken.includes('GLOVE') || weaponToken.includes('WRAPS')) return 'Gloves'

  return 'Other'
}

export type { WeaponTypeBucket }

/** Categoria de taxa para skins sem tipo de arma (bucket Other). */
export const FALLBACK_WEAPON_CATEGORY = 'All'

export const WEAPON_TYPE_OPTIONS: WeaponTypeBucket[] = (
  Object.keys(WEAPON_BUCKETS) as WeaponTypeBucket[]
).filter((bucket) => bucket !== 'Other')
