import { useQuery } from "@tanstack/react-query";

import { getArrivals } from "../../infrastructure/api";

export const useStopArrivals = (stopId: string) =>
  useQuery({
    queryKey: ["arrivals", stopId],
    queryFn: () => getArrivals(stopId),
    enabled: stopId.length > 0,
    refetchInterval: 30000
  });
