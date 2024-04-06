import "./App.css";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  User,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  DocumentReference,
} from "firebase/firestore";
import {
  Household,
  addCatsToHousehold,
  addHousehold,
  addLitterEvent,
  fetchCatsOfHousehold,
  fetchMostRecentLitterEvents,
  fetchOwnedHousehold,
} from "./api";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const queryClient = new QueryClient();

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, "127.0.0.1", 8080);

setPersistence(auth, browserLocalPersistence);

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <h1>Cat Litter Tracker</h1>
        <div className="card">
          <CurrentUser />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  );
}

export default App;

const CurrentUser = () => {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    if (user || loading || error) {
      return;
    }
    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(auth);
    ui.start("#firebaseui-auth-container", {
      signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
      signInSuccessUrl: "/",
    });
  }, [user, loading, error]);

  async function loadHousehold(userId: string): Promise<Household | undefined> {
    const household = (await fetchOwnedHousehold(db, userId))[0];
    if (!household) {
      const householdId = await addHousehold(db, {
        name: "My Household",
        roles: { [userId]: "owner" },
      });
      await addCatsToHousehold(db, householdId, [{ name: "Yoda" }]);
      return (await fetchOwnedHousehold(db, userId))[0];
    }
    return household;
  }

  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }
  if (user) {
    return <UserDashboard user={user} getHousehold={loadHousehold} />;
  } else {
    return <UserSignedOut />;
  }
};

function UserSignedOut() {
  return <div id="firebaseui-auth-container"></div>;
}

function UserDashboard({
  user,
  getHousehold: getHousehold,
}: {
  user: User;
  getHousehold: (userId: string) => Promise<Household | undefined>;
}) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["householdByUserId", user.uid],
    queryFn: () => getHousehold(user.uid),
  });

  async function loadCat(
    householdId: string
  ): Promise<DocumentReference | undefined> {
    return (await fetchCatsOfHousehold(db, householdId))[0];
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
      <h2 id="householdName">{data ? data.name : "My household"}</h2>
      <Cat householdId={data?.id} getCat={loadCat} />
    </>
  );
}

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
