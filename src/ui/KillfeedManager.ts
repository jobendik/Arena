export class KillfeedManager {
    private container: HTMLElement;
    private maxItems: number = 5;
    private itemDuration: number = 4000; // 4 seconds

    constructor() {
        this.container = document.getElementById('killfeed-container')!;
        if (!this.container) {
            console.error('Killfeed container not found!');
        }
    }

    public addKill(killer: string, victim: string, weapon: string, isHeadshot: boolean, isMultiKill: boolean = false): void {
        if (!this.container) return;

        // Use requestAnimationFrame to defer DOM manipulation
        requestAnimationFrame(() => {
            const item = document.createElement('div');
            item.className = 'killfeed-item';
            if (isHeadshot) item.classList.add('headshot');
            if (isMultiKill) item.classList.add('multikill');

            // Build HTML string for better performance (single innerHTML vs multiple appendChild)
            const killerClass = killer === 'Enemy' ? 'killfeed-killer enemy' : 'killfeed-killer';
            const victimClass = victim === 'Player' ? 'killfeed-victim player' : 'killfeed-victim';
            const headshotIcon = isHeadshot 
                ? '<img src="assets/images/Headshot-Icon.png_ca1ab804.png" class="killfeed-icon">'
                : '';
            
            item.innerHTML = `
                <span class="${killerClass}">${killer}</span>
                <span class="killfeed-weapon">[${weapon}]</span>
                ${headshotIcon}
                <span class="${victimClass}">${victim}</span>
            `;

            // Add to container
            this.container.appendChild(item);

            // Manage max items
            while (this.container.children.length > this.maxItems) {
                if (this.container.firstChild) {
                    this.container.removeChild(this.container.firstChild);
                }
            }

            // Auto remove
            setTimeout(() => {
                item.style.animation = 'fadeOut 0.5s ease-out forwards';
                setTimeout(() => {
                    if (item.parentNode === this.container) {
                        this.container.removeChild(item);
                    }
                }, 500);
            }, this.itemDuration);
        });
    }
}
