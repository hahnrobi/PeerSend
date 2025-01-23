const rooms: Record<string, Set<string>> = {};

export const addUserToRoom = (room: string, user: string) => {
    if(!rooms[room]) {
        rooms[room] = new Set();
    }
    rooms[room].add(user);
}

export const removeUserFromRoom = (room: string, user: string) => {
    if(!rooms[room]) {
        return;
    }
    rooms[room].delete(user);
    if(rooms[room].size === 0) {
        delete rooms[room];
    }
}

export const getRoomUsers = (room: string) => {
    return rooms[room];
}
