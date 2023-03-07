export interface FiltersState {
  clusters: Record<string, boolean>;
}

export interface Cluster {
  key: string;
  color: string;
  clusterLabel: string;
}
