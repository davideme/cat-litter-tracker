import { Cat, addLitterEvent, fetchMostRecentLitterEvents } from "../api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { db, queryClient } from "../firebase";
import LitterEvents from "./LitterEvents";

function CatComponent({
  householdId,
  getCat,
}: {
  householdId?: string;
  getCat: (householdId: string) => Promise<Cat | undefined>;
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
      <h3>{data?.name || "Luna"}</h3>
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

export default CatComponent;
