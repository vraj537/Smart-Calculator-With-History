/**
 * ============================================================================
 * SMART CALCULATOR WITH HISTORY - DSA PROJECT JAVASCRIPT
 * ============================================================================
 * Data Structures Implemented:
 * 1. Queue (FIFO)               : Stores incoming expression tokens
 * 2. Stack (LIFO - Operators)   : Infix to Postfix conversion
 * 3. Stack (LIFO - Operands)    : Postfix evaluation
 * 4. Doubly Linked List         : History storage with bidirectional navigation
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. DATA STRUCTURE CLASSES
// ----------------------------------------------------------------------------

/**
 * Array-based Queue implementation
 */
class Queue {
  constructor() {
    this.items = [];
  }
  enqueue(element) {
    this.items.push(element);
  }
  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift();
  }
  front() {
    if (this.isEmpty()) return null;
    return this.items[0];
  }
  isEmpty() {
    return this.items.length === 0;
  }
  size() {
    return this.items.length;
  }
  toArray() {
    return [...this.items];
  }
  clear() {
    this.items = [];
  }
}

/**
 * Array-based Stack implementation (Used for both Operators and Operands)
 */
class Stack {
  constructor() {
    this.items = [];
  }
  push(element) {
    this.items.push(element);
  }
  pop() {
    if (this.isEmpty()) return null;
    return this.items.pop();
  }
  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.items.length - 1];
  }
  isEmpty() {
    return this.items.length === 0;
  }
  size() {
    return this.items.length;
  }
  toArray() {
    return [...this.items];
  }
  clear() {
    this.items = [];
  }
}

/**
 * Doubly Linked List Node
 */
class DLLNode {
  constructor(id, expression, postfix, result) {
    this.id = id;
    this.expression = expression;
    this.postfix = postfix;
    this.result = result;
    this.prev = null;
    this.next = null;
    this.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

/**
 * Doubly Linked List Implementation
 */
class DoublyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;
    this.counter = 0;
  }

  // Insert node at the tail (O(1))
  insertAtTail(expression, postfix, result) {
    this.counter++;
    const newNode = new DLLNode(this.counter, expression, postfix, result);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      newNode.prev = this.tail;
      this.tail = newNode;
    }
    this.size++;
    this.current = this.tail; // Default current pointer to latest node
    return newNode;
  }

  // Clear the list
  clear() {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;
  }

  // Move current to previous node
  stepPrev() {
    if (this.current && this.current.prev) {
      this.current = this.current.prev;
      return true;
    }
    return false;
  }

  // Move current to next node
  stepNext() {
    if (this.current && this.current.next) {
      this.current = this.current.next;
      return true;
    }
    return false;
  }

  // Return nodes as array (head to tail)
  toArray() {
    const nodes = [];
    let temp = this.head;
    while (temp) {
      nodes.push(temp);
      temp = temp.next;
    }
    return nodes;
  }
}

// ----------------------------------------------------------------------------
// 2. OPERATOR PRECEDENCE & MATH HELPERS
// ----------------------------------------------------------------------------

function getPrecedence(op) {
  if (op === '^') return 3;
  if (op === '*' || op === '/') return 2;
  if (op === '+' || op === '-') return 1;
  return 0;
}

function isOperator(ch) {
  return ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^';
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

// ----------------------------------------------------------------------------
// 3. APPLICATION STATE
// ----------------------------------------------------------------------------

const historyDLL = new DoublyLinkedList();

let currentInput = '';
let justCalculated = false;

// Step-by-step visual animation queue
let visualSteps = [];
let currentStepIndex = 0;
let animationTimer = null;

// DOM Elements
const displayMain = document.getElementById('display-main');
const displayPrev = document.getElementById('display-prev');

const visualQueue = document.getElementById('visual-queue');
const visualOpStack = document.getElementById('visual-op-stack');
const visualPostfix = document.getElementById('visual-postfix');
const visualEvalStack = document.getElementById('visual-eval-stack');

const stepStatusBox = document.getElementById('step-status-box');
const currentPhaseBadge = document.getElementById('current-phase-badge');
const currentPhaseDesc = document.getElementById('current-phase-desc');

const chkAnimate = document.getElementById('chk-animate');
const btnStepForward = document.getElementById('btn-step-forward');

const historyNodesList = document.getElementById('history-nodes-list');
const historyCount = document.getElementById('history-count');
const btnClearHistory = document.getElementById('btn-clear-history');

const btnNavPrev = document.getElementById('btn-nav-prev');
const btnNavNext = document.getElementById('btn-nav-next');
const navIndicator = document.getElementById('nav-indicator');
const currentNodePreview = document.getElementById('current-node-preview');

const dllTapeContainer = document.getElementById('dll-tape-container');

// Modals
const modalTheory = document.getElementById('modal-theory');
const modalCCode = document.getElementById('modal-c-code');
const btnTheoryModal = document.getElementById('btn-theory-modal');
const btnCCodeModal = document.getElementById('btn-c-code-modal');
const cCodeContent = document.getElementById('c-code-content');

// ----------------------------------------------------------------------------
// 4. CALCULATOR INPUT LOGIC
// ----------------------------------------------------------------------------

function updateDisplay() {
  displayMain.classList.remove('error');
  displayMain.textContent = currentInput === '' ? '0' : currentInput;
}

function showError(msg) {
  displayMain.classList.add('error');
  displayMain.textContent = msg;
}

function handleInputChar(char) {
  if (justCalculated) {
    // If user starts typing a number right after a calculation, clear screen
    if (!isOperator(char) && char !== '^') {
      currentInput = '';
      displayPrev.textContent = '';
    }
    justCalculated = false;
  }

  // Prevent invalid consecutive operators
  if (isOperator(char)) {
    const lastChar = currentInput.slice(-1);
    if (isOperator(lastChar)) {
      currentInput = currentInput.slice(0, -1);
    }
  }

  currentInput += char;
  updateDisplay();
}

function handleClear() {
  currentInput = '';
  displayPrev.textContent = '';
  justCalculated = false;
  updateDisplay();
  resetVisualizer();
}

function handleBackspace() {
  if (justCalculated) {
    handleClear();
    return;
  }
  currentInput = currentInput.slice(0, -1);
  updateDisplay();
}

// ----------------------------------------------------------------------------
// 5. CALCULATION & STEP RECORDER (QUEUE -> STACK -> EVAL -> DLL)
// ----------------------------------------------------------------------------

async function askBackend(cmd) {
  const res = await fetch('/api?cmd=' + encodeURIComponent(cmd));
  const text = await res.text();
  return text.split('\n').filter(l => l !== '');
}

function splitTokens(field) {
  const f = (field || '').trim();
  return f === '' ? [] : f.split(/\s+/);
}

function loadHistory(lines) {
  historyDLL.clear();
  let curId = 0;
  lines.forEach(line => {
    const p = line.split('|');
    if (p[0] === 'NODE') {
      const node = historyDLL.insertAtTail(p[2], p[3].trim(), parseInt(p[4], 10));
      node.id = parseInt(p[1], 10);
    } else if (p[0] === 'CUR') {
      curId = parseInt(p[1], 10);
    }
  });
  const found = historyDLL.toArray().find(n => n.id === curId);
  if (found) historyDLL.current = found;
  renderHistoryUI();
}

function makeDesc(code, t, postfix, expr, result) {
  if (code === '1') return `Stored all tokens into Input Queue (FIFO order).`;
  if (code === '2e') return `Generated complete Postfix Expression: ${postfix.join(' ')}`;
  if (code === '4') return `Saved '${expr} = ${result}' into Doubly Linked List (Head -> Tail with prev & next pointers).`;
  const isNum = /^[0-9]+$/.test(t);
  if (code === '2') {
    if (isNum) return `Operand '${t}' directly added to Postfix output.`;
    if (t === '(') return `Pushed '(' to Operator Stack.`;
    if (t === ')') return `Closed parenthesis ')' encountered: popped operators until '('.`;
    return `Operator '${t}' processed: higher/equal precedence operators popped, '${t}' pushed.`;
  }
  if (isNum) return `Number '${t}' pushed to Operand Evaluation Stack.`;
  return `Operator '${t}': popped two numbers, calculated and pushed the result back.`;
}

async function runCalculation(rawExpr) {
  if (!rawExpr || rawExpr.trim() === '') return;
  const expr = rawExpr.trim();
  visualSteps = [];
  currentStepIndex = 0;

  let lines;
  try {
    lines = await askBackend('CALC ' + expr);
  } catch (err) {
    showError('Backend not running');
    return;
  }

  const phases = { '1': '1. Enqueue', '2': '2. Infix -> Postfix', '2e': '2. Infix -> Postfix Complete', '3': '3. Evaluation', '4': '4. Doubly Linked List' };
  let finalResult = null;
  for (const line of lines) {
    const p = line.split('|');
    if (p[0] === 'ERR') {
      showError(p[1]);
      return;
    }
    if (p[0] === 'OK') finalResult = p[1];
  }
  for (const line of lines) {
    const p = line.split('|');
    if (p[0] !== 'STEP') continue;
    const postfix = splitTokens(p[5]);
    visualSteps.push({
      phase: phases[p[1]],
      desc: makeDesc(p[1], p[2], postfix, expr, finalResult),
      queue: splitTokens(p[3]),
      opStack: splitTokens(p[4]),
      postfix: postfix,
      evalStack: splitTokens(p[6]),
      activeToken: p[2],
      isDone: p[1] === '4'
    });
  }

  displayPrev.textContent = expr + ' =';
  currentInput = String(finalResult);
  justCalculated = true;
  updateDisplay();

  loadHistory(await askBackend('HIST'));

  if (chkAnimate.checked) {
    playAnimation();
  } else {
    jumpToEndVisualization();
  }
}

// ----------------------------------------------------------------------------
// 6. VISUALIZER RENDERING & ANIMATION
// ----------------------------------------------------------------------------

function renderStep(step) {
  currentPhaseBadge.textContent = step.phase;
  currentPhaseDesc.textContent = step.desc;

  // Queue Lane
  if (!step.queue || step.queue.length === 0) {
    visualQueue.innerHTML = '<span class="empty-state">Queue is empty</span>';
  } else {
    visualQueue.innerHTML = step.queue
      .map(item => `<div class="chip ${isOperator(item) ? 'op' : 'num'}">${item}</div>`)
      .join('');
  }

  // Operator Stack Lane
  if (!step.opStack || step.opStack.length === 0) {
    visualOpStack.innerHTML = '<span class="empty-state">Stack is empty</span>';
  } else {
    visualOpStack.innerHTML = step.opStack
      .map((item, idx) => {
        const isTop = idx === step.opStack.length - 1;
        return `<div class="chip op ${isTop ? 'active-highlight' : ''}">${item}</div>`;
      })
      .join('');
  }

  // Postfix Lane
  if (!step.postfix || step.postfix.length === 0) {
    visualPostfix.innerHTML = '<span class="empty-state">No postfix expression generated yet</span>';
  } else {
    visualPostfix.innerHTML = step.postfix
      .map(item => `<div class="chip ${isOperator(item) ? 'op' : 'num'}">${item}</div>`)
      .join('');
  }

  // Eval Stack Lane
  if (!step.evalStack || step.evalStack.length === 0) {
    visualEvalStack.innerHTML = '<span class="empty-state">Evaluation stack is empty</span>';
  } else {
    visualEvalStack.innerHTML = step.evalStack
      .map((item, idx) => {
        const isTop = idx === step.evalStack.length - 1;
        return `<div class="chip num ${isTop ? 'active-highlight' : ''}">${item}</div>`;
      })
      .join('');
  }
}

function playAnimation() {
  if (animationTimer) clearInterval(animationTimer);
  currentStepIndex = 0;
  btnStepForward.disabled = false;

  renderStep(visualSteps[currentStepIndex]);

  animationTimer = setInterval(() => {
    currentStepIndex++;
    if (currentStepIndex >= visualSteps.length) {
      clearInterval(animationTimer);
      animationTimer = null;
      btnStepForward.disabled = true;
      return;
    }
    renderStep(visualSteps[currentStepIndex]);
  }, 450);
}

function jumpToEndVisualization() {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
  if (visualSteps.length > 0) {
    currentStepIndex = visualSteps.length - 1;
    renderStep(visualSteps[currentStepIndex]);
  }
  btnStepForward.disabled = true;
}

function resetVisualizer() {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
  visualSteps = [];
  currentStepIndex = 0;
  btnStepForward.disabled = true;

  currentPhaseBadge.textContent = 'Phase: Idle';
  currentPhaseDesc.textContent = "Enter an expression and press '=' to visualize Data Structure steps.";
  visualQueue.innerHTML = '<span class="empty-state">Queue is empty</span>';
  visualOpStack.innerHTML = '<span class="empty-state">Stack is empty</span>';
  visualPostfix.innerHTML = '<span class="empty-state">No postfix expression generated yet</span>';
  visualEvalStack.innerHTML = '<span class="empty-state">Evaluation stack is empty</span>';
}

// ----------------------------------------------------------------------------
// 7. DOUBLY LINKED LIST UI & TRAVERSAL
// ----------------------------------------------------------------------------

function renderHistoryUI() {
  const nodes = historyDLL.toArray();
  historyCount.textContent = `${historyDLL.size} node${historyDLL.size === 1 ? '' : 's'}`;

  // Update Navigation buttons
  if (historyDLL.size === 0) {
    btnNavPrev.disabled = true;
    btnNavNext.disabled = true;
    navIndicator.textContent = 'No Nodes';
    currentNodePreview.innerHTML = '<div class="preview-empty">Perform a calculation to create Doubly Linked List nodes</div>';
    historyNodesList.innerHTML = `
      <div class="empty-history">
        <span>📝</span>
        <p>No calculations yet.<br>Every calculation is stored as a doubly linked list node with previous and next pointers.</p>
      </div>`;
    dllTapeContainer.innerHTML = '<span class="empty-state">HEAD = NULL &nbsp;|&nbsp; TAIL = NULL</span>';
    return;
  }

  const curr = historyDLL.current;
  btnNavPrev.disabled = !curr || !curr.prev;
  btnNavNext.disabled = !curr || !curr.next;

  // Find index of current node
  const currIndex = nodes.findIndex(n => n === curr);
  navIndicator.textContent = `Node ${currIndex + 1} of ${historyDLL.size}`;

  // Preview box for current node
  if (curr) {
    currentNodePreview.innerHTML = `
      <div class="preview-details">
        <div class="preview-line">
          <span>Expression:</span>
          <span>${curr.expression}</span>
        </div>
        <div class="preview-line">
          <span>Postfix:</span>
          <span>${curr.postfix}</span>
        </div>
        <div class="preview-line">
          <span>Result:</span>
          <span class="res">= ${curr.result}</span>
        </div>
        <div class="preview-pointers">
          <span>&larr; Prev: ${curr.prev ? curr.prev.expression : 'NULL (Head)'}</span>
          <span>Next: ${curr.next ? curr.next.expression : 'NULL (Tail)'} &rarr;</span>
        </div>
      </div>
    `;
  }

  // Render History nodes list (Newest to oldest)
  const reversedNodes = [...nodes].reverse();
  historyNodesList.innerHTML = reversedNodes
    .map(node => {
      const isSelected = node === curr;
      return `
        <div class="history-node-item ${isSelected ? 'active-nav-node' : ''}" data-id="${node.id}">
          <div class="hist-left">
            <div class="hist-expr">${node.expression}</div>
            <div class="hist-postfix">${node.postfix}</div>
          </div>
          <div class="hist-right">
            <div class="hist-res">= ${node.result}</div>
          </div>
        </div>
      `;
    })
    .join('');

  // Attach click listeners to history items
  document.querySelectorAll('.history-node-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.getAttribute('data-id'), 10);
      const targetNode = nodes.find(n => n.id === id);
      if (targetNode) {
        historyDLL.current = targetNode;
        currentInput = String(targetNode.result);
        displayPrev.textContent = targetNode.expression + ' =';
        justCalculated = true;
        updateDisplay();
        renderHistoryUI();
      }
    });
  });

  // Render Bottom DLL Tape
  renderDLLTape(nodes, curr);
}

function renderDLLTape(nodes, currNode) {
  let tapeHTML = '<div class="dll-arrow">HEAD &rarr;</div>';

  nodes.forEach((node, idx) => {
    const isHead = idx === 0;
    const isTail = idx === nodes.length - 1;
    const isCurr = node === currNode;

    let roleBadge = '';
    if (isHead && isTail) roleBadge = '<span class="node-role-badge badge-head">HEAD & TAIL</span>';
    else if (isHead) roleBadge = '<span class="node-role-badge badge-head">HEAD</span>';
    else if (isTail) roleBadge = '<span class="node-role-badge badge-tail">TAIL</span>';

    tapeHTML += `
      <div class="dll-node-chip ${isHead ? 'highlight-head' : ''} ${isTail ? 'highlight-tail' : ''} ${isCurr ? 'highlight-current' : ''}">
        ${roleBadge}
        <div class="node-expr-text">${node.expression}</div>
        <div class="node-res-text">= ${node.result}</div>
        <div class="node-ptrs-text">
          <span>&larr; ${node.prev ? 'prev' : 'NULL'}</span> | 
          <span>${node.next ? 'next' : 'NULL'} &rarr;</span>
        </div>
      </div>
    `;

    if (!isTail) {
      tapeHTML += '<div class="dll-arrow">&harr;</div>';
    }
  });

  tapeHTML += '<div class="dll-arrow">&rarr; TAIL (NULL)</div>';
  dllTapeContainer.innerHTML = tapeHTML;
}

// ----------------------------------------------------------------------------
// 8. EVENT LISTENERS
// ----------------------------------------------------------------------------

// Keypad Button Clicks
document.querySelectorAll('.key').forEach(button => {
  button.addEventListener('click', () => {
    const char = button.getAttribute('data-char');
    const action = button.getAttribute('data-action');

    if (char) {
      handleInputChar(char);
    } else if (action === 'clear') {
      handleClear();
    } else if (action === 'backspace') {
      handleBackspace();
    } else if (action === 'equals') {
      runCalculation(currentInput);
    }
  });
});

// Step Forward Button
btnStepForward.addEventListener('click', () => {
  if (currentStepIndex < visualSteps.length - 1) {
    currentStepIndex++;
    renderStep(visualSteps[currentStepIndex]);
    if (currentStepIndex === visualSteps.length - 1) {
      btnStepForward.disabled = true;
    }
  }
});

// DLL Navigation Buttons (the C backend moves the current pointer)
btnNavPrev.addEventListener('click', async () => {
  loadHistory(await askBackend('PREV'));
});

btnNavNext.addEventListener('click', async () => {
  loadHistory(await askBackend('NEXT'));
});

btnClearHistory.addEventListener('click', async () => {
  if (confirm('Clear all calculation history from Doubly Linked List?')) {
    loadHistory(await askBackend('CLEAR'));
  }
});

// Physical Keyboard Listener
window.addEventListener('keydown', e => {
  if (['+', '-', '*', '/', '(', ')', '^'].includes(e.key)) {
    e.preventDefault();
    handleInputChar(e.key);
  } else if (e.key >= '0' && e.key <= '9') {
    handleInputChar(e.key);
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    runCalculation(currentInput);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    handleBackspace();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    handleClear();
  }
});

// Modals Handling
btnTheoryModal.addEventListener('click', () => {
  modalTheory.classList.add('active');
});

btnCCodeModal.addEventListener('click', () => {
  loadCCode();
  modalCCode.classList.add('active');
});

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetModalId = btn.getAttribute('data-close');
    document.getElementById(targetModalId).classList.remove('active');
  });
});

window.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

async function loadCCode() {
  try {
    const res = await fetch('/backend.c');
    cCodeContent.textContent = await res.text();
  } catch (err) {
    cCodeContent.textContent = 'backend.c is in the project folder';
  }
}

// Initialize on page load
updateDisplay();
renderHistoryUI();
askBackend('HIST').then(loadHistory).catch(() => showError('Backend not running'));
