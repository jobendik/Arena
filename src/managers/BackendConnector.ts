export interface GameStats {
    kills: number;
    score: number;
    timePlayed: number;
    won: boolean;
}

export interface Loadout {
    currency: {
        riftTokens: number;
        plasmaCredits: number;
    };
    equipped: {
        primary: string;
        secondary: string;
    };
}

export class BackendConnector {
    private baseUrl: string;
    private token: string;

    constructor() {
        this.baseUrl = 'http://localhost:3000/api/game';
        // Hardcoded for dev: User 1 (RiftPlayerOne)
        this.token = 'mock-jwt-token-1';
    }

    private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Backend request failed:', error);
            return null;
        }
    }

    public async getLoadout(): Promise<Loadout | null> {
        console.log('Fetching loadout from backend...');
        return await this.request('/loadout');
    }

    public async syncStats(stats: GameStats): Promise<any> {
        console.log('Syncing stats to backend:', stats);
        return await this.request('/sync', {
            method: 'POST',
            body: JSON.stringify(stats)
        });
    }
}
