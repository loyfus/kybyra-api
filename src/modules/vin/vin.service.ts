import axios from 'axios';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

type DecodeResultRow = { Variable: string; Value: string | null; ValueId?: string | null };
type DecodeResponse = { Results: DecodeResultRow[] };

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

export async function decodeVin(vin: string) {
  const upper = vin.toUpperCase();
  if (!VIN_RE.test(upper)) {
    throw AppError.badRequest('VIN inválido (esperado 17 caracteres alfanuméricos, sem I/O/Q)');
  }

  const url = `${env.NHTSA_BASE_URL}/DecodeVin/${upper}?format=json`;
  const { data } = await axios.get<DecodeResponse>(url, { timeout: 10_000 });

  const map = new Map<string, string | null>();
  for (const row of data.Results ?? []) {
    if (row.Value && row.Value !== 'Not Applicable' && row.Value !== '0') {
      map.set(row.Variable, row.Value);
    }
  }

  return {
    vin: upper,
    make: map.get('Make') ?? null,
    model: map.get('Model') ?? null,
    modelYear: map.get('Model Year') ?? null,
    bodyClass: map.get('Body Class') ?? null,
    fuelType: map.get('Fuel Type - Primary') ?? null,
    fuelType2: map.get('Fuel Type - Secondary') ?? null,
    electrificationLevel: map.get('Electrification Level') ?? null,
    plant: {
      country: map.get('Plant Country') ?? null,
      city: map.get('Plant City') ?? null,
      manufacturer: map.get('Plant Company Name') ?? null,
    },
    raw: Object.fromEntries(map),
  };
}
