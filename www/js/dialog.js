export class Dialog {
    #dialog;
    #backdrop;
    #onConfirm;
    #onCancel;

    /**
     * @param {Object} options - Dialog configuration
     * @param {string} options.title - Dialog title
     * @param {string} options.description - Dialog description text
     * @param {string} options.placeholder - Input placeholder text
     * @param {string} options.initialValue - Initial input value
     * @param {Function} options.validate - Function to validate input, returns {valid: boolean, error?: string}
     * @param {Function} options.parse - Function to parse input string to desired format
     * @param {Function} options.onConfirm - Function called with parsed result when confirmed
     * @param {Function} options.onCancel - Function called when cancelled (optional)
     */
    constructor(options) {
        this.#onConfirm = options.onConfirm;
        this.#onCancel = options.onCancel;
        this.#createDialog(options);
    }

    #createDialog(options) {
        // Create dialog container
        this.#dialog = document.createElement('div');
        this.#dialog.className = 'dialog-container';

        this.#dialog.innerHTML = `
            <h3 class="dialog-title">${options.title}</h3>
            <p class="dialog-description">${options.description}</p>
            <input type="text" id="dialogInput" class="dialog-input" placeholder="${options.placeholder || ''}">
            <div class="dialog-buttons">
                <button id="cancelBtn" class="dialog-btn dialog-btn-cancel">Cancel</button>
                <button id="okBtn" class="dialog-btn dialog-btn-confirm">OK</button>
            </div>
        `;

        // Create backdrop
        this.#backdrop = document.createElement('div');
        this.#backdrop.className = 'dialog-backdrop';

        this.#setupEventListeners(options);
    }

    #setupEventListeners(options) {
        const input = this.#dialog.querySelector('#dialogInput');
        const okBtn = this.#dialog.querySelector('#okBtn');
        const cancelBtn = this.#dialog.querySelector('#cancelBtn');

        // Set initial value if provided
        if (options.initialValue) {
            input.value = options.initialValue;
        }

        const closeDialog = () => {
            this.#backdrop.remove();
            this.#dialog.remove();
            if (this.#onCancel) {
                this.#onCancel();
            }
        };

        okBtn.addEventListener('click', () => {
            const text = input.value.trim();
            
            // Validate input
            if (options.validate) {
                const validationResult = options.validate(text);
                if (!validationResult.valid) {
                    alert(validationResult.error || 'Invalid input');
                    return;
                }
            }

            // Parse input
            let parsedResult = text;
            if (options.parse) {
                parsedResult = options.parse(text);
            }

            // Call confirm callback
            if (this.#onConfirm) {
                this.#onConfirm(parsedResult);
            }
            
            closeDialog();
        });

        cancelBtn.addEventListener('click', closeDialog);
        this.#backdrop.addEventListener('click', closeDialog);

        // Focus on input and allow Enter key
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                okBtn.click();
            }
        });
    }

    /**
     * Shows the dialog within the specified container
     * @param {HTMLElement} container - The container to show the dialog in
     */
    show(container) {
        // Ensure the container has relative positioning for absolute children
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        container.appendChild(this.#backdrop);
        container.appendChild(this.#dialog);
    }
}
