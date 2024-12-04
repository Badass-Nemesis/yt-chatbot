// Circular buffer (ring buffer) implementation
export class CircularBuffer<T> {
    private buffer: (T | null)[];
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

    // Add a message to the buffer if it's new
    add(message: T): void {
        this.buffer[this.end] = message;
        this.end = (this.end + 1) % this.capacity;

        if (this.size < this.capacity) {
            this.size++;
        } else {
            this.start = (this.start + 1) % this.capacity; // Overwrite oldest message
        }
    }

    // Check if the message is a duplicate
    contains(message: T): boolean {
        for (let i = 0; i < this.size; i++) {
            const index = (this.start + i) % this.capacity;
            if (this.buffer[index] === message) {
                return true;
            }
        }
        return false;
    }

    // Retrieve all messages
    getMessages(): T[] {
        const messages: T[] = [];

        for (let i = 0; i < this.size; i++) {
            const index = (this.start + i) % this.capacity;
            if (this.buffer[index] !== null) {
                messages.push(this.buffer[index] as T);
            }
        }

        return messages;
    }

    // Clear the buffer
    clear(): void {
        this.buffer.fill(null);
        this.start = 0;
        this.end = 0;
        this.size = 0;
    }
}
