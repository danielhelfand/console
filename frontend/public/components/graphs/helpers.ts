import * as _ from 'lodash-es';

import {PROMETHEUS_BASE_PATH, PROMETHEUS_TENANCY_BASE_PATH} from './index';

export enum PrometheusEndpoint {
  LABEL = 'api/v1/label',
  QUERY = 'api/v1/query',
  QUERY_RANGE = 'api/v1/query_range',
}

// Range vector queries require end, start, and step search params
const getRangeVectorSearchParams = (timespan: number, endTime: number = Date.now(), samples: number = 60): URLSearchParams => {
  const init = timespan ? [
    [ 'end', `${endTime / 1000}` ],
    [ 'start', `${(endTime - timespan) / 1000}` ],
    [ 'step', `${timespan / samples / 1000}` ],
  ] : [];
  return new URLSearchParams(init);
};

const getSearchParams = ({endpoint, endTime, timespan, samples, ...params}: PrometheusURLProps): URLSearchParams => {
  const searchParams = endpoint === PrometheusEndpoint.QUERY_RANGE ? getRangeVectorSearchParams(timespan, endTime, samples) : new URLSearchParams();
  _.each(params, (value, key) => value && searchParams.append(key, value.toString()));
  return searchParams;
};

export const getPrometheusURL = (props: PrometheusURLProps): string => {
  const basePath = props.namespace ? PROMETHEUS_TENANCY_BASE_PATH : PROMETHEUS_BASE_PATH;
  const params = getSearchParams(props);
  return `${basePath}/${props.endpoint}?${params.toString()}`;
};

type PrometheusURLProps = {
  endpoint: PrometheusEndpoint;
  endTime?: number;
  namespace?: string;
  query: string;
  samples: number;
  timeout?: string;
  timespan: number;
};
