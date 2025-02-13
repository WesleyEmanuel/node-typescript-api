import { InternalError } from '@src/util/errors/internal-error';
import { AxiosStatic } from 'axios';
import config, { IConfig } from 'config';

export interface StormGlassPointSource {
  [key: string]: number;
}

export interface StormGlassPoint {
  readonly time: string;
  readonly waveHeight: StormGlassPointSource;
  readonly waveDirection: StormGlassPointSource;
  readonly swellDirection: StormGlassPointSource;
  readonly swellHeight: StormGlassPointSource;
  readonly swellPeriod: StormGlassPointSource;
  readonly windDirection: StormGlassPointSource;
  readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassForecastResponse {
  hours: StormGlassPoint[];
}

export interface ForecastPoint {
  time: string;
  waveHeight: number;
  waveDirection: number;
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  windDirection: number;
  windSpeed: number;
}

export class ClientRequestError extends InternalError{
  constructor(message: string){
    const internalErrorMessage = 'Unexpected error when trying comunicate to StormGlass'
    super(`${internalErrorMessage}: ${message}`)
  }
}

export class StormGlassResponseError extends InternalError{
  constructor(message: string){
    const internalErrorMessage = 'Unexpected error returned by the StormGlass service'
    super(`${internalErrorMessage}: ${message}`)
  }
}

const stormGlassResourcesConfig: IConfig = config.get('App.resources.StormGlass')

export class StormGlass {
  readonly stormGlassAPIParams =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';

  readonly stormGlassAPISource = 'noaa';

  constructor(protected request: AxiosStatic) {}

  public async fetchPoints(lat: number, lng: number): Promise<ForecastPoint[]> {
    const response = await this.request.get<StormGlassForecastResponse>(
      `${stormGlassResourcesConfig.get('apiUrl')}/weather/point?params=${this.stormGlassAPIParams}&source=${this.stormGlassAPISource}&lat=${lat}&lng=${lng}`,
      {
        headers: {
          Authorization: stormGlassResourcesConfig.get('apiToken')
        }
      }
    ).catch((err) => {
      if(err.response?.status == 429){
        throw new StormGlassResponseError(`Error: ${JSON.stringify(err.response.data)} Code: 429`)
      }

      throw new ClientRequestError(err.message)
    });

    return this.normalizeResponse(response.data);
  }

  private normalizeResponse(points: StormGlassForecastResponse): ForecastPoint[] {
    return points.hours
      .filter(this.isValidPoint.bind(this))
      .map((point: any) => ({
          time: point.time,
          waveHeight: point.waveHeight[this.stormGlassAPISource],
          waveDirection: point.waveDirection[this.stormGlassAPISource],
          swellDirection: point.swellDirection[this.stormGlassAPISource],
          swellHeight: point.swellHeight[this.stormGlassAPISource],
          swellPeriod: point.swellPeriod[this.stormGlassAPISource],
          windDirection: point.windDirection[this.stormGlassAPISource],
          windSpeed: point.windSpeed[this.stormGlassAPISource]
        })
      );
  }

  private isValidPoint(point: Partial<StormGlassPoint>): boolean {
    return !!(
      point.time &&
      point.waveHeight?.[this.stormGlassAPISource] &&
      point.waveDirection?.[this.stormGlassAPISource] &&
      point.swellDirection?.[this.stormGlassAPISource] &&
      point.swellHeight?.[this.stormGlassAPISource] &&
      point.swellPeriod?.[this.stormGlassAPISource] &&
      point.windDirection?.[this.stormGlassAPISource] &&
      point.windSpeed?.[this.stormGlassAPISource]
    );
  }
}
