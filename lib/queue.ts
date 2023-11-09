class Queue {
    private queue: (() => void)[] = [];
    private isProcessing: boolean = false;

    enqueue(task: () => void) {
        this.queue.push(task);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private processQueue() {
        if (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                this.isProcessing = true;
                task(); // Removed the callback function here
                this.processQueue(); // Automatically move to the next task
            }
        } else {
            this.isProcessing = false;
        }
    }
}