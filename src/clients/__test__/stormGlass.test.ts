import { StormGlass } from '@src/clients/stormGlass';
import axios from 'axios';
import stormGlassWeatherFixture from '@test/fixtures/stormglass_wheater.json';
import stormGlassNormalizedFixture from '@test/fixtures/stormglass_normalized_response.json';

jest.mock('axios');

describe('StormGlass client', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it('should return the normalized forecast from the StormGlass service', async () => {
    const lat = -3.753363;
    const lng = -38.490787;

    mockedAxios.get.mockResolvedValue({ data: stormGlassWeatherFixture });
    
    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual(stormGlassNormalizedFixture);
  });

  it('should exclude incomplete data points', async () => {
    const lat = -3.753363;
    const lng = -38.490787;

    const incompleteResponse = {
      hours: [
        {
          "swellDirection": {
            "noaa": 64.26
          },
          "time": "2020-04-26T00:00:00+00:00"
        }
      ]
    };

    mockedAxios.get.mockResolvedValue({data: incompleteResponse});

    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual([]);
  });

  it('should get a generic error from StormGlass service when the request fail before reaching the service', async () => {
    const lat = -3.753363;
    const lng = -38.490787;

    mockedAxios.get.mockRejectedValue({message: 'Network Error'});

    const stormGlass = new StormGlass(mockedAxios);

    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying comunicate to StormGlass: Network Error'
    );
  });
});
