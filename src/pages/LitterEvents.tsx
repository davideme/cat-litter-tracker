import { useQuery } from "@tanstack/react-query";

function LitterEvents({
  householdId,
  catId,
  getLitterEvent,
}: {
  householdId?: string;
  catId?: string;
  getLitterEvent: (
    householdId: string,
    catId: string
  ) => Promise<{ name: string; timestamp: string } | undefined>;
}) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["litterEventByHouseholdIdAndCatId", householdId, catId],
    queryFn: () => getLitterEvent(householdId!, catId!),
    enabled: !!catId,
  });

  if (isPending) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isError && data !== undefined) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <p>
      Last changed:{" "}
      <span id="lastChanged">
        {data?.timestamp
          ? new Date(data.timestamp).toLocaleString()
          : "Not yet changed"}
      </span>
    </p>
  );
}

export default LitterEvents;
