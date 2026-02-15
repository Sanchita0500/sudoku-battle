export type GameDifficulty = 'easy' | 'medium' | 'hard';

export enum GameStatus {
    Idle = 'idle',
    Playing = 'playing',
    Won = 'won',
    Lost = 'lost',
    Disconnected = 'disconnected'
}

export enum RoomStatus {
    Waiting = 'waiting',
    Playing = 'playing',
    Finished = 'finished'
}
