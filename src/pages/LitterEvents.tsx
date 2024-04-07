import { useQuery } from "@tanstack/react-query";
import { LitterEvent } from "../api";

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
  ) => Promise<LitterEvent[]>;
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

  const listItems = data?.map((litterEvent) => (
    <li key={litterEvent.id}>
      {litterEvent?.name}{" "}
      {litterEvent?.timestamp &&
        new Date(litterEvent.timestamp).toLocaleString()}
    </li>
  ));

  const lastChanged = data && data[0];

  return (
    <>
      <p>
        Last changed:{" "}
        <span id="lastChanged">
          {lastChanged?.timestamp
            ? new Date(lastChanged.timestamp).toLocaleString()
            : "Not yet changed"}
        </span>
      </p>
      <ul>{listItems}</ul>
    </>
  );
}

export default LitterEvents;
