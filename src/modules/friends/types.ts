export interface Friend {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  online: boolean;
}

export type FriendsSyncPayload = {
  friends: Friend[];
  requests: {
    incoming: Omit<Friend, "online">[];
    outgoing: Omit<Friend, "online">[];
  };
};

export type FriendsPayload = {
  friends: Omit<Friend, "online">[];
  requests: {
    incoming: Omit<Friend, "online">[];
    outgoing: Omit<Friend, "online">[];
  };
}

