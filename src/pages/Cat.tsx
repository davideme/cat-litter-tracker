import { DocumentReference } from "firebase/firestore";
import { addLitterEvent, fetchMostRecentLitterEvents } from "../api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { db, queryClient } from "../firebase";

function Cat({
  householdId,
  getCat,
}: {
  litterEvent?: { name: string; timestamp: string };
  householdId?: string;
  getCat: (householdId: string) => Promise<DocumentReference | undefined>;
}) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["catByHouseholdId", householdId],
    queryFn: () => getCat(householdId!),
    enabled: !!householdId,
  });
  const mutation = useMutation({
    mutationFn: async () => {
      return await addLitterEvent(db, householdId!, data?.id!, {
        name: "changed litter",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["litterEventByHouseholdIdAndCatId"],
      });
    },
  });

  async function loadLitterEvents(
    householdId: string,
    catId: string
  ): Promise<{ name: string; timestamp: string } | undefined> {
    return (await fetchMostRecentLitterEvents(db, householdId, catId))[0];
  }

  if (isPending) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <button
        id="changeLitter"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        Change Litter
      </button>
      {mutation.isError ? (
        <div>An error occurred: {mutation.error.message}</div>
      ) : null}
      <LitterEvents
        householdId={householdId}
        catId={data?.id}
        getLitterEvent={loadLitterEvents}
      />
    </>
  );
}

export default Cat;

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
