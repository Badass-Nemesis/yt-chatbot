// Circular buffer (ring buffer) implementation for storing new messages and removing old messages
export class CircularBuffer {
    private buffer: ({ name: string; message: string } | null)[];
    private start: number;
    private end: number;
    private size: number;
    private capacity: number;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.buffer = new Array(capacity).fill(null);
        this.start = 0;
        this.end = 0;
        this.size = 0;
    }

    // adding a message to the buffer if it's a new message
    add(message: { name: string; message: string }): void {
        this.buffer[this.end] = message;
        this.end = (this.end + 1) % this.capacity;

        if (this.size < this.capacity) {
            this.size++;
        } else {
            this.start = (this.start + 1) % this.capacity; // overwriting oldest message if no space
        }
    }

    // function for checking if the message is a duplicate or not
    // it helps in only storing new messages
    contains(message: { name: string; message: string }): boolean {
        for (let i = 0; i < this.size; i++) {
            const index = (this.start + i) % this.capacity;
            if (this.buffer[index]?.name === message.name && this.buffer[index]?.message === message.message) {
                return true;
            }
        }
        return false;
    }

    getMessages(): { name: string; message: string }[] {
        const messages: { name: string; message: string }[] = [];

        for (let i = 0; i < this.size; i++) {
            const index = (this.start + i) % this.capacity;
            if (this.buffer[index] !== null) {
                messages.push(this.buffer[index] as { name: string; message: string });
            }
        }

        return messages;
    }

    // putting this casually
    clear(): void {
        this.buffer.fill(null);
        this.start = 0;
        this.end = 0;
        this.size = 0;
    }
}
