
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

document.addEventListener('DOMContentLoaded', (event) => {
    const workspaceElement = document.querySelector('.workspace');
    const toolboxElement = document.querySelector('.toolbox');
    const shortcutWorkspaceElement = document.querySelector('.shortcut-workspace');
    const shortcutToolboxElement = document.querySelector('.shortcut-toolbox');

    window.workspace = new Workspace(workspaceElement);

    const toolboxBlocks = document.querySelectorAll('.toolbox .block');
    const varValueBlocks = Array.from({ length: 10 }, (_, i) => new VarValueBlock(i));
    const varNameBlocks = ['var1', 'var2', 'var3'].map(name => new VarNameBlock(name));
    const routineBlock = new RoutineBlock();

    toolboxBlocks.forEach(block => {
        block.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.type);
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        });
    });

    varValueBlocks.forEach(varBlock => {
        toolboxElement.appendChild(varBlock.element);
    });

    varNameBlocks.forEach(varBlock => {
        toolboxElement.appendChild(varBlock.element);
    });

    toolboxElement.appendChild(routineBlock.element);

    workspaceElement.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('block')) {
            const rect = e.target.getBoundingClientRect();
            e.target.dragOffsetX = e.clientX - rect.left;
            e.target.dragOffsetY = e.clientY - rect.top;
            e.dataTransfer.setData('text/plain', e.target.dataset.type);
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        }
    });

    const routineNames = ['coup_de_poing', 'coup_de_pied'];
    const routineNameBlocks = routineNames.map(name => new RoutineNameBlock(name));

    routineNameBlocks.forEach(routineBlock => {
        shortcutToolboxElement.appendChild(routineBlock.element);
    });

    document.getElementById('newShortcutButton').addEventListener('click', () => createShortcutBlock(shortcutWorkspaceElement));
});


function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    function dragMouseDown(e) {
        if (e.button !== 0) return; // Only handle left mouse button
        if (e.target.tagName.toLowerCase() === 'input') {
            // Si l'élément cible est un champ d'entrée, arrêter la propagation de l'événement
            return;
        }
        e = e || window.event;
        e.preventDefault();
        console.log("drag mouse down");
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        // set the element's new position:
        elmnt.style.top = e.offsetY + "px";
        elmnt.style.left = e.offsetX + "px";
        updateConnections(elmnt); // Update the lines connected to this element
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }

    elmnt.onmousedown = dragMouseDown;
}




function updateConnections(block) {
    const inputConnection = block.querySelector('.input-point');
    const outputConnection = block.querySelector('.output-point');

    // Update lines connected to the input connection
    if (inputConnection.connectedLine) {
        console.log('input');
        const line = inputConnection.connectedLine;
        const startX = parseFloat(line.dataset.startX);
        const startY = parseFloat(line.dataset.startY);
        const endX = inputConnection.getBoundingClientRect().left - block.parentElement.getBoundingClientRect().left + 5; // Adjust for the center of the point
        const endY = inputConnection.getBoundingClientRect().top - block.parentElement.getBoundingClientRect().top + 5;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        line.style.width = `${distance}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.dataset.endX = endX;
        line.dataset.endY = endY;
    }

    // Update lines connected to the output connection
    if (outputConnection.connectedLine) {
        console.log('output');
        const line = outputConnection.connectedLine;
        const startX = outputConnection.getBoundingClientRect().left - block.parentElement.getBoundingClientRect().left + 5; // Adjust for the center of the point
        const startY = outputConnection.getBoundingClientRect().top - block.parentElement.getBoundingClientRect().top + 5;
        const endX = parseFloat(line.dataset.endX);
        const endY = parseFloat(line.dataset.endY);
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        line.style.width = `${distance}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.dataset.startX = startX;
        line.dataset.startY = startY;
    }
}



class Block {
    constructor(type) {
        this.type = type;
        this.element = this.createElement();
        this.inputConnection = this.element.querySelector('.input-point');
        this.outputConnection = this.element.querySelector('.output-point');
        this.connectedBlock = null; // Ajouter cette ligne
        this.addConnectionEvents();
    }

    createElement() {
        const block = document.createElement('div');
        block.classList.add('block');
        block.setAttribute('draggable', true);
        block.setAttribute('data-type', this.type);
        block.textContent = this.type.toUpperCase();
        block.appendChild(this.createDeleteButton());
        block.appendChild(this.createConnectionPoint('input-point'));
        block.appendChild(this.createConnectionPoint('output-point'));

        block.addEventListener('dragstart', (e) => this.dragStart(e));
        block.addEventListener('mousedown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') {
                e.stopPropagation(); // Empêche l'événement mousedown de se propager pour permettre la focalisation
            }
        });
        block.addEventListener('mouseup', (e) => e.preventDefault()); // Empêche la sélection de texte sur mouseup

        return block;
    }


    mouseDown(e) {
        // Empêche la sélection de texte sur mousedown, sauf si l'élément cible est un champ d'entrée
        if (e.target.tagName.toLowerCase() !== 'input') {
            e.preventDefault();
        }
    }


    createDeleteButton() {
        const btn = document.createElement('span');
        btn.textContent = 'Delete';
        btn.classList.add('delete-btn');
        btn.onclick = () => {
            this.element.remove();
        };
        return btn;
    }

    createConnectionPoint(className) {
        const point = document.createElement('div');
        point.classList.add('connection-point', className);
        return point;
    }

    addConnectionEvents() {
        this.outputConnection.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right mouse button
                workspace.startConnection(this, e);
                e.preventDefault(); // Prevent the context menu from appearing
            }
        });
    }

    dragStart(e) {
        console.log("drag start");
        const rect = e.target.getBoundingClientRect();
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    generateCode() {
        return '';
    }

    disableDrag() {
        this.element.removeAttribute('draggable');
        this.element.classList.remove('dragging');
    }
}

class BlockDebut extends Block {
    constructor() {
        super('debut');
    }

    generateCode() {
        // return 'DEBUT\n';
        return '// DEBUT\n';
    }
}

class BlockFin extends Block {
    constructor() {
        super('fin');
    }

    generateCode() {
        return '// FIN\n';
    }
}



class BlockVariableInt extends Block {
    constructor() {
        super('variable_int');
    }

    createElement() {
        const block = super.createElement();
        block.innerHTML = '';

        const varNameInput = this.createVarInput('text', 'Nom de la variable', 'var-name', 'varname');
        const equalText = document.createElement('span');
        equalText.textContent = " ← ";
        const varValueInput = this.createVarInput('number', 'Valeur', 'var-value', 'int');

        block.appendChild(varNameInput);
        block.appendChild(equalText);
        block.appendChild(varValueInput);
        block.appendChild(this.createDeleteButton());
        block.appendChild(this.createConnectionPoint('input-point'));
        block.appendChild(this.createConnectionPoint('output-point'));

        return block;
    }

    createVarInput(type, placeholder, className, acceptType = null) {
        const input = document.createElement('input');
        input.setAttribute('type', type);
        input.setAttribute('placeholder', placeholder);
        input.classList.add(className);
        input.style.marginRight = '5px';
        input.addEventListener('input', this.validateVarName);

        if (acceptType) {
            input.setAttribute('data-accept-type', acceptType);
            input.addEventListener('dragover', this.handleDragOver);
            input.addEventListener('drop', this.handleDrop);
        }

        return input;
    }

    handleDragOver(e) {
        if (e.dataTransfer.getData('var-block') === 'true') {
            const acceptType = e.target.getAttribute('data-accept-type');
            if (e.dataTransfer.getData('text/plain') === acceptType) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        }
    }

    handleDrop(e) {
        if (e.dataTransfer.getData('var-block') === 'true') {
            const acceptType = e.target.getAttribute('data-accept-type');
            if (e.dataTransfer.getData('text/plain') === acceptType) {
                e.preventDefault();
                if (acceptType === 'varname') {
                    const name = e.dataTransfer.getData('name');
                    e.target.value = name;
                } else if (acceptType === 'int') {
                    const value = e.dataTransfer.getData('value');
                    e.target.value = value;
                }
            }
        }
    }

    validateVarName(e) {
        const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        if (!regex.test(e.target.value)) {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
        }
    }

    generateCode() {
        const varName = this.element.querySelector('.var-name').value;
        const varValue = this.element.querySelector('.var-value').value;
        return `${varName} = ${varValue};\n`;
    }
}


class BlockIf extends Block {
    constructor() {
        super('si');
    }

    generateCode() {
        return `if (condition) {\n`;
    }
}

class BlockEndIf extends Block {
    constructor() {
        super('fin_si');
    }

    generateCode() {
        return `}\n`;
    }
}

class BlockEcrire extends Block {
    constructor() {
        super('ecrire');
    }

    generateCode() {
        const toWrite = prompt("Que voulez-vous écrire?");
        return `console.log(${toWrite});\n`;
    }
}

// VARBLOCKS

// garder ?
class VarBlock {
    constructor(type) {
        this.type = type;
        this.element = this.createElement();
    }

    createElement() {
        const block = document.createElement('div');
        block.classList.add('var-block');
        block.setAttribute('draggable', true);
        block.setAttribute('data-type', this.type);
        block.setAttribute('data-var-name', this.type); // Assuming var name is same as type for simplicity

        const colorMap = {
            'string': 'green',
            'int': 'red',
            'bool': 'yellow'
        };
        block.style.backgroundColor = colorMap[this.type];
        block.textContent = this.type.toUpperCase();

        block.addEventListener('dragstart', (e) => this.dragStart(e));
        return block;
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.setData('var-block', 'true'); // Mark as VarBlock
        e.dataTransfer.setData('var-name', e.target.dataset.varName); // Add var name to data transfer
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }
}


class VarValueBlock {
    constructor(value) {
        this.value = value;
        this.type = 'int';
        this.element = this.createElement();
    }

    createElement() {
        const block = document.createElement('div');
        block.classList.add('var-value-block', 'var-block');
        block.setAttribute('draggable', true);
        block.setAttribute('data-type', this.type);
        block.setAttribute('data-value', this.value);

        block.style.backgroundColor = 'red';
        block.textContent = this.value;

        block.addEventListener('dragstart', (e) => this.dragStart(e));
        return block;
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.setData('var-block', 'true'); // Mark as VarBlock
        e.dataTransfer.setData('value', e.target.dataset.value); // Add value to data transfer
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }
}

class VarNameBlock {
    constructor(name) {
        this.name = name;
        this.type = 'varname';
        this.element = this.createElement();
    }

    createElement() {
        const block = document.createElement('div');
        block.classList.add('var-name-block', 'var-block');
        block.setAttribute('draggable', true);
        block.setAttribute('data-type', this.type);
        block.setAttribute('data-name', this.name);

        block.style.backgroundColor = 'grey';
        block.textContent = this.name;

        block.addEventListener('dragstart', (e) => this.dragStart(e));
        return block;
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.setData('var-block', 'true'); // Mark as VarBlock
        e.dataTransfer.setData('name', e.target.dataset.name); // Add name to data transfer
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }
}


// ROUTINES BLOCKS

class RoutineBlock extends Block {
    constructor() {
        super('routine');
        this.routineName = 'sayHello'; // Nom par défaut de la routine
    }

    createElement() {
        const block = super.createElement();
        block.innerHTML = '';

        const routineNameText = document.createElement('div');
        routineNameText.textContent = this.routineName;

        const routineBodyText = document.createElement('div');
        routineBodyText.textContent = "sayHello";

        block.appendChild(routineNameText);
        block.appendChild(document.createElement('br'));
        block.appendChild(routineBodyText);
        block.appendChild(this.createDeleteButton());
        block.appendChild(this.createConnectionPoint('input-point'));
        block.appendChild(this.createConnectionPoint('output-point'));

        return block;
    }

    generateCode() {
        return `function ${this.routineName}() {\n    console.log('Hello');\n}\n${this.routineName}();\n`;
    }
}




class Workspace {
    constructor(element) {
        this.element = element;
        this.blocks = [];
        this.currentConnection = null;
        this.currentLine = null;
        this.init();
    }

    init() {
        this.element.addEventListener('dragover', (e) => this.dragOver(e));
        this.element.addEventListener('drop', (e) => this.drop(e));
    }

    dragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    drop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        const draggingBlock = document.querySelector('.toolbox .block.dragging, .workspace .block.dragging');
        
        if (draggingBlock && draggingBlock.parentElement.classList.contains('workspace')) {
            // Move existing block
            const offsetX = draggingBlock.dragOffsetX || 0;
            const offsetY = draggingBlock.dragOffsetY || 0;
            draggingBlock.style.left = `${e.clientX - this.element.getBoundingClientRect().left - offsetX}px`;
            draggingBlock.style.top = `${e.clientY - this.element.getBoundingClientRect().top - offsetY}px`;
            draggingBlock.classList.remove('dragging');
        } else {
            // Create new block if dragging from toolbox
            let block;
            switch(type) {
                case 'debut':
                    block = new BlockDebut();
                    break;
                case 'fin':
                    block = new BlockFin();
                    break;
                case 'variable_int':
                    block = new BlockVariableInt();
                    break;
                case 'ecrire':
                    block = new BlockEcrire();
                    break;
                case 'routine':
                    block = new RoutineBlock();
                    break;
            }
    
            if (block) {
                block.element.style.position = 'absolute';
                const offsetX = block.dragOffsetX || 0;
                const offsetY = block.dragOffsetY || 0;
                block.element.style.left = `${e.clientX - this.element.getBoundingClientRect().left - offsetX}px`;
                block.element.style.top = `${e.clientY - this.element.getBoundingClientRect().top - offsetY}px`;
                this.element.appendChild(block.element);
                block.disableDrag();
                this.blocks.push(block);
    
                // Make the new block draggable
                dragElement(block.element);
            }
        }
    }
    
    

   




    startConnection(block, e) {
        const startX = e.clientX - this.element.getBoundingClientRect().left;
        const startY = e.clientY - this.element.getBoundingClientRect().top;
        this.currentConnection = { block, startX, startY };
    
        this.currentLine = document.createElement('div');
        this.currentLine.classList.add('line');
        this.currentLine.style.left = `${startX}px`;
        this.currentLine.style.top = `${startY}px`;
        this.currentLine.style.width = `2px`;
        this.currentLine.style.height = `2px`;
        this.currentLine.dataset.startX = startX;
        this.currentLine.dataset.startY = startY;
        this.element.appendChild(this.currentLine);
    
        document.addEventListener('mousemove', this.trackMouse);
        document.addEventListener('mouseup', this.endConnection);
    }
    
    
    endConnection = (e) => {
        document.removeEventListener('mousemove', this.trackMouse);
        document.removeEventListener('mouseup', this.endConnection);
    
        const endX = e.clientX - this.element.getBoundingClientRect().left;
        const endY = e.clientY - this.element.getBoundingClientRect().top;
    
        const endBlock = this.blocks.find(block => {
            const rect = block.inputConnection.getBoundingClientRect();
            return (
                endX >= rect.left - this.element.getBoundingClientRect().left &&
                endX <= rect.right - this.element.getBoundingClientRect().left &&
                endY >= rect.top - this.element.getBoundingClientRect().top &&
                endY <= rect.bottom - this.element.getBoundingClientRect().top
            );
        });
    
        if (endBlock && endBlock !== this.currentConnection.block) {
            const startX = this.currentConnection.startX;
            const startY = this.currentConnection.startY;
            const endXAdjusted = endX;
            const endYAdjusted = endY;
    
            const deltaX = endXAdjusted - startX;
            const deltaY = endYAdjusted - startY;
    
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
            this.currentLine.style.width = `${distance}px`;
            this.currentLine.style.transform = `rotate(${angle}deg)`;
            this.currentLine.style.left = `${startX}px`;
            this.currentLine.style.top = `${startY}px`;
            this.currentLine.style.transformOrigin = '0 0';
            this.currentLine.dataset.endX = endXAdjusted;
            this.currentLine.dataset.endY = endYAdjusted;
    
            this.currentConnection.block.outputConnection.connectedLine = this.currentLine;
            endBlock.inputConnection.connectedLine = this.currentLine;
            
            this.currentConnection.block.connectedBlock = endBlock; // Ajouter cette ligne
        } else {
            this.currentLine.remove();
        }
    
        this.currentConnection = null;
        this.currentLine = null;
    };
    

    trackMouse = (e) => {
        if (!this.currentConnection) return;
        const startX = this.currentConnection.startX;
        const startY = this.currentConnection.startY;
        const endX = e.clientX - this.element.offsetLeft;
        const endY = e.clientY - this.element.offsetTop;

        const deltaX = endX - startX;
        const deltaY = endY - startY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        this.currentLine.style.width = `${distance}px`;
        this.currentLine.style.transform = `rotate(${angle}deg)`;
    };


    runCode() {
        let code = '';
        const blocks = this.blocks.filter(block => block instanceof BlockDebut || block instanceof BlockFin);
        if (blocks.length > 0) {
            const queue = [blocks.find(block => block instanceof BlockDebut)];
            while (queue.length > 0) {
                const currentBlock = queue.shift();
                code += currentBlock.generateCode();
                if (currentBlock.outputConnection && currentBlock.outputConnection.connectedTo) {
                    queue.push(currentBlock.outputConnection.connectedTo);
                }
            }
        }
        document.getElementById('codeOutput').textContent = code;
        try {
            eval(code);
        } catch (e) {
            console.error(e);
        }
    }
    
}


// SHORTCUT WORKSPACE


// class RoutineNameBlock {
//     constructor(name) {
//         this.name = name;
//         this.element = this.createElement();
//     }

//     createElement() {
//         const block = document.createElement('div');
//         block.classList.add('routine-name-block');
//         block.setAttribute('draggable', true);
//         block.setAttribute('data-name', this.name);
//         block.textContent = this.name;

//         block.addEventListener('dragstart', (e) => this.dragStart(e));
//         return block;
//     }

//     dragStart(e) {
//         e.dataTransfer.setData('text/plain', e.target.dataset.name);
//         setTimeout(() => {
//             e.target.classList.add('dragging');
//         }, 0);
//     }
// }

// class RoutineNameBlock {
//     constructor(name) {
//         this.name = name;
//         this.element = this.createElement();
//     }

//     createElement() {
//         const block = document.createElement('div');
//         block.classList.add('routine-name-block');
//         block.setAttribute('draggable', true);
//         block.setAttribute('data-name', this.name);
//         block.textContent = this.name;

//         block.addEventListener('dragstart', (e) => this.dragStart(e));
//         return block;
//     }

//     dragStart(e) {
//         e.dataTransfer.setData('text/plain', e.target.dataset.name);
//         e.dataTransfer.effectAllowed = 'move'; // Assurez-vous que le type de déplacement est autorisé
//         setTimeout(() => {
//             e.target.classList.add('dragging');
//         }, 0);
//     }
// }

class RoutineNameBlock {
    constructor(name) {
        this.name = name;
        this.element = this.createElement();
    }

    createElement() {
        const block = document.createElement('div');
        block.classList.add('routine-name-block');
        block.setAttribute('draggable', true);
        block.setAttribute('data-name', this.name);
        block.textContent = this.name;

        block.addEventListener('dragstart', (e) => this.dragStart(e));
        return block;
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.name);
        e.dataTransfer.setData('type', 'routine'); // Ajout du type de donnée
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            e.target.classList.add('dragging');
            // console.log('start: ')
            // console.log(e.dataTransfer.getData('type'));
        }, 0);
    }
}


function createShortcutBlock(workspaceElement) {
    const shortcutBlock = document.createElement('div');
    shortcutBlock.classList.add('shortcut-block');

    const conditionDiv = document.createElement('div');
    conditionDiv.classList.add('condition');

    const conditionText = document.createElement('span');
    conditionText.textContent = 'key == ';

    const keySelect = document.createElement('select');
    keySelect.innerHTML = `
        <option value="a">a</option>
        <option value="b">b</option>
        <option value="c">c</option>
        <option value="d">d</option>
    `;

    conditionDiv.appendChild(conditionText);
    conditionDiv.appendChild(keySelect);

    const actionDiv = document.createElement('div');
    actionDiv.classList.add('action');

    const actionInput = document.createElement('input');
    actionInput.setAttribute('type', 'text');
    actionInput.setAttribute('placeholder', 'Routine');
    actionInput.setAttribute('data-accept-type', 'routine'); // Définir le type accepté
    actionInput.addEventListener('dragover', handleDragOver);
    actionInput.addEventListener('drop', handleDrop);

    actionDiv.appendChild(actionInput);

    shortcutBlock.appendChild(conditionDiv);
    shortcutBlock.appendChild(actionDiv);
    workspaceElement.appendChild(shortcutBlock);
}

function handleDragOver(e) {
    console.log("over");
    console.log(e.target);
    const acceptType = e.target.getAttribute('data-accept-type');
    if (e.dataTransfer.getData('type') === acceptType) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
}

function handleDrop(e) {
    e.preventDefault();
    const acceptType = e.target.getAttribute('data-accept-type');
    if (e.dataTransfer.getData('type') === acceptType) {
        const routineName = e.dataTransfer.getData('text/plain');
        e.target.value = routineName;
    }
}


