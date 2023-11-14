import { StormGlass } from '@src/clients/stormGlass';
import axios from 'axios';
import stormGlassWeatherFixture from '@test/fixtures/stormglass_wheater.json';
import stormGlassNormalizedFixture from '@test/fixtures/stormglass_normalized_response.json';

jest.mock('axios');

describe('StormGlass client', () => {
  it('should return the normalized forecast from the StormGlass service', async () => {
    const lat = -3.753363;
    const lng = -38.490787;

    axios.get = jest.fn().mockResolvedValue(stormGlassWeatherFixture);

    const stormGlass = new StormGlass(axios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual(stormGlassNormalizedFixture);
  });
});
