/**
 * ============================================
 * CALCULATOR - JavaScript Implementation
 * ============================================
 * 
 * ไฟล์นี้ควบคุมการทำงานของเครื่องคิดเลข
 * 
 * Features:
 * - บวก ลบ คูณ หาร
 * - คำนวณเปอร์เซ็นต์
 * - เปลี่ยนเครื่องหมาย (+/-)
 * - รองรับทศนิยม
 * - รองรับการใช้คีย์บอร์ด
 * - Event Delegation สำหรับ performance ที่ดี
 * 
 * Best Practices ที่ใช้:
 * - ES6+ syntax (const, let, arrow functions)
 * - querySelector สำหรับเข้าถึง DOM
 * - addEventListener สำหรับดักจับ events
 * - Event Delegation
 * - IIFE เพื่อป้องกัน global scope pollution
 * 
 * ============================================
 */

// IIFE (Immediately Invoked Function Expression)
// ใช้เพื่อป้องกันตัวแปรรั่วไหลสู่ global scope
(function() {
    'use strict';

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    // Object เก็บสถานะของเครื่องคิดเลข
    const calculatorState = {
        currentValue: '0',      // ค่าปัจจุบันที่แสดงบนหน้าจอ
        previousValue: '',      // ค่าก่อนหน้า (สำหรับคำนวณ)
        operator: null,         // operator ที่เลือก (+, -, ×, ÷)
        waitingForNewValue: false,  // รอรับค่าใหม่หลังกด operator
        equation: ''            // สมการที่แสดง
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    // ใช้ querySelector เพื่อเข้าถึง DOM elements
    const display = {
        result: document.querySelector('.calculator__result'),
        equation: document.querySelector('.calculator__equation')
    };

    const keypad = document.querySelector('.calculator__keypad');

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * formatNumber - จัดรูปแบบตัวเลขให้มีเครื่องหมายคั่นหลักพัน
     * @param {string} numStr - ตัวเลขในรูปแบบ string
     * @returns {string} - ตัวเลขที่จัดรูปแบบแล้ว
     */
    const formatNumber = (numStr) => {
        // ตรวจสอบว่าเป็นตัวเลขที่ถูกต้องหรือไม่
        if (numStr === '' || numStr === '-' || isNaN(parseFloat(numStr))) {
            return numStr;
        }

        // แยกส่วนจำนวนเต็มและทศนิยม
        const parts = numStr.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1];

        // จัดรูปแบบส่วนจำนวนเต็มด้วย locale
        const formattedInteger = parseInt(integerPart, 10).toLocaleString('en-US');

        // รวมกับส่วนทศนิยม (ถ้ามี)
        if (decimalPart !== undefined) {
            return `${formattedInteger}.${decimalPart}`;
        }
        
        // ถ้ามีจุดทศนิยมแต่ยังไม่มีตัวเลขหลังจุด
        if (numStr.endsWith('.')) {
            return `${formattedInteger}.`;
        }

        return formattedInteger;
    };

    /**
     * updateDisplay - อัปเดตหน้าจอแสดงผล
     * แสดงทั้งผลลัพธ์และสมการ
     */
    const updateDisplay = () => {
        // อัปเดตผลลัพธ์หลัก
        display.result.textContent = formatNumber(calculatorState.currentValue);
        
        // อัปเดตสมการ
        display.equation.textContent = calculatorState.equation || '0';
    };

    // ============================================
    // CALCULATION FUNCTIONS
    // ============================================

    /**
     * calculate - คำนวณผลลัพธ์จาก 2 ตัวเลข
     * @param {number} firstOperand - ตัวเลขแรก
     * @param {number} secondOperand - ตัวเลขที่สอง
     * @param {string} operator - เครื่องหมาย operator
     * @returns {number} - ผลลัพธ์การคำนวณ
     */
    const calculate = (firstOperand, secondOperand, operator) => {
        switch (operator) {
            case '+':
                return firstOperand + secondOperand;
            case '-':
                return firstOperand - secondOperand;
            case '×':
                return firstOperand * secondOperand;
            case '÷':
                // ตรวจสอบการหารด้วย 0
                if (secondOperand === 0) {
                    return 'Error';
                }
                return firstOperand / secondOperand;
            default:
                return secondOperand;
        }
    };

    // ============================================
    // ACTION HANDLERS
    // ============================================

    /**
     * handleNumber - จัดการเมื่อกดปุ่มตัวเลข
     * @param {string} num - ตัวเลขที่กด (0-9)
     */
    const handleNumber = (num) => {
        // ถ้ากำลังรอค่าใหม่ ให้เริ่มตัวเลขใหม่
        if (calculatorState.waitingForNewValue) {
            calculatorState.currentValue = num;
            calculatorState.waitingForNewValue = false;
        } else {
            // ถ้าค่าปัจจุบันเป็น 0 ให้แทนที่ด้วยตัวเลขใหม่
            // ถ้าไม่ใช่ ให้ต่อท้าย
            if (calculatorState.currentValue === '0') {
                calculatorState.currentValue = num;
            } else {
                // จำกัดความยาวไม่เกิน 12 หลัก
                if (calculatorState.currentValue.replace(/[^0-9]/g, '').length < 12) {
                    calculatorState.currentValue += num;
                }
            }
        }
        
        updateDisplay();
    };

    /**
     * handleOperator - จัดการเมื่อกดปุ่ม operator (+, -, ×, ÷)
     * @param {string} nextOperator - operator ที่กด
     */
    const handleOperator = (nextOperator) => {
        const currentNum = parseFloat(calculatorState.currentValue);

        // ถ้ามี operator อยู่แล้วและไม่ได้รอค่าใหม่ ให้คำนวณก่อน
        if (calculatorState.operator && !calculatorState.waitingForNewValue) {
            const prevNum = parseFloat(calculatorState.previousValue);
            const result = calculate(prevNum, currentNum, calculatorState.operator);
            
            if (result === 'Error') {
                // จัดการกรณีหารด้วย 0
                calculatorState.currentValue = 'Error';
                calculatorState.previousValue = '';
                calculatorState.operator = null;
                calculatorState.equation = 'Cannot divide by zero';
                updateDisplay();
                return;
            }
            
            // ปัดเศษผลลัพธ์เพื่อหลีกเลี่ยงปัญหา floating point
            calculatorState.currentValue = String(Math.round(result * 1e12) / 1e12);
        }

        // บันทึกค่าปัจจุบันและ operator
        calculatorState.previousValue = calculatorState.currentValue;
        calculatorState.operator = nextOperator;
        calculatorState.waitingForNewValue = true;
        
        // อัปเดตสมการที่แสดง
        calculatorState.equation = `${formatNumber(calculatorState.previousValue)} ${nextOperator}`;
        
        updateDisplay();
    };

    /**
     * handleEquals - จัดการเมื่อกดปุ่ม =
     * คำนวณผลลัพธ์สุดท้าย
     */
    const handleEquals = () => {
        // ถ้าไม่มี operator ให้ return
        if (!calculatorState.operator) return;

        const currentNum = parseFloat(calculatorState.currentValue);
        const prevNum = parseFloat(calculatorState.previousValue);

        // แสดงสมการเต็ม
        calculatorState.equation = `${formatNumber(calculatorState.previousValue)} ${calculatorState.operator} ${formatNumber(calculatorState.currentValue)} =`;

        // คำนวณผลลัพธ์
        const result = calculate(prevNum, currentNum, calculatorState.operator);

        if (result === 'Error') {
            calculatorState.currentValue = 'Error';
            calculatorState.equation = 'Cannot divide by zero';
        } else {
            // ปัดเศษผลลัพธ์
            calculatorState.currentValue = String(Math.round(result * 1e12) / 1e12);
        }

        // รีเซ็ต operator
        calculatorState.previousValue = '';
        calculatorState.operator = null;
        calculatorState.waitingForNewValue = true;

        updateDisplay();
    };

    /**
     * handleClear - ล้างค่าทั้งหมด (ปุ่ม C)
     */
    const handleClear = () => {
        calculatorState.currentValue = '0';
        calculatorState.previousValue = '';
        calculatorState.operator = null;
        calculatorState.waitingForNewValue = false;
        calculatorState.equation = '';
        
        updateDisplay();
    };

    /**
     * handleDecimal - จัดการเมื่อกดปุ่มจุดทศนิยม
     */
    const handleDecimal = () => {
        // ถ้ากำลังรอค่าใหม่ ให้เริ่มด้วย '0.'
        if (calculatorState.waitingForNewValue) {
            calculatorState.currentValue = '0.';
            calculatorState.waitingForNewValue = false;
            updateDisplay();
            return;
        }

        // ถ้ายังไม่มีจุดทศนิยม ให้เพิ่ม
        if (!calculatorState.currentValue.includes('.')) {
            calculatorState.currentValue += '.';
            updateDisplay();
        }
    };

    /**
     * handleSign - เปลี่ยนเครื่องหมาย +/- (ปุ่ม ±)
     */
    const handleSign = () => {
        if (calculatorState.currentValue === '0') return;
        
        // สลับเครื่องหมาย
        if (calculatorState.currentValue.startsWith('-')) {
            calculatorState.currentValue = calculatorState.currentValue.slice(1);
        } else {
            calculatorState.currentValue = '-' + calculatorState.currentValue;
        }
        
        updateDisplay();
    };

    /**
     * handlePercent - คำนวณเปอร์เซ็นต์
     */
    const handlePercent = () => {
        const currentNum = parseFloat(calculatorState.currentValue);
        calculatorState.currentValue = String(currentNum / 100);
        updateDisplay();
    };

    /**
     * handleBackspace - ลบตัวเลขท้ายสุด
     */
    const handleBackspace = () => {
        if (calculatorState.waitingForNewValue) return;
        if (calculatorState.currentValue === 'Error') {
            handleClear();
            return;
        }

        // ลบตัวท้ายสุด
        calculatorState.currentValue = calculatorState.currentValue.slice(0, -1);
        
        // ถ้าเหลือว่างหรือแค่เครื่องหมายลบ ให้เป็น 0
        if (calculatorState.currentValue === '' || calculatorState.currentValue === '-') {
            calculatorState.currentValue = '0';
        }
        
        updateDisplay();
    };

    // ============================================
    // EVENT DELEGATION
    // ============================================
    // ใช้ Event Delegation โดยผูก event listener กับ keypad container
    // แทนที่จะผูกกับทุกปุ่ม เพื่อ performance ที่ดีขึ้น

    /**
     * handleKeypadClick - จัดการ click events บน keypad
     * ใช้ Event Delegation pattern
     * @param {Event} event - click event object
     */
    const handleKeypadClick = (event) => {
        // ตรวจสอบว่า click ที่ปุ่มหรือไม่
        const button = event.target.closest('.calculator__key');
        if (!button) return;

        // อ่าน data attributes
        const action = button.dataset.action;
        const value = button.dataset.value;

        // เรียก function ที่เหมาะสมตาม action
        switch (action) {
            case 'number':
                handleNumber(value);
                break;
            case 'operator':
                handleOperator(value);
                break;
            case 'equals':
                handleEquals();
                break;
            case 'clear':
                handleClear();
                break;
            case 'decimal':
                handleDecimal();
                break;
            case 'sign':
                handleSign();
                break;
            case 'percent':
                handlePercent();
                break;
        }

        // เพิ่ม visual feedback
        button.classList.add('calculator__key--active');
        setTimeout(() => {
            button.classList.remove('calculator__key--active');
        }, 100);
    };

    // ============================================
    // KEYBOARD SUPPORT
    // ============================================

    /**
     * handleKeyboardInput - จัดการ input จากคีย์บอร์ด
     * @param {KeyboardEvent} event - keyboard event object
     */
    const handleKeyboardInput = (event) => {
        const key = event.key;

        // ตัวเลข 0-9
        if (/^[0-9]$/.test(key)) {
            event.preventDefault();
            handleNumber(key);
            return;
        }

        // Operators
        switch (key) {
            case '+':
                event.preventDefault();
                handleOperator('+');
                break;
            case '-':
                event.preventDefault();
                handleOperator('-');
                break;
            case '*':
                event.preventDefault();
                handleOperator('×');
                break;
            case '/':
                event.preventDefault();
                handleOperator('÷');
                break;
            case 'Enter':
            case '=':
                event.preventDefault();
                handleEquals();
                break;
            case 'Escape':
            case 'c':
            case 'C':
                event.preventDefault();
                handleClear();
                break;
            case '.':
            case ',':
                event.preventDefault();
                handleDecimal();
                break;
            case 'Backspace':
                event.preventDefault();
                handleBackspace();
                break;
            case '%':
                event.preventDefault();
                handlePercent();
                break;
        }
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================
    // ผูก event listeners เมื่อ DOM พร้อม

    /**
     * initCalculator - เริ่มต้นเครื่องคิดเลข
     * ผูก event listeners และเตรียม display
     */
    const initCalculator = () => {
        // ตรวจสอบว่า elements มีอยู่จริง
        if (!keypad || !display.result || !display.equation) {
            console.error('Calculator elements not found');
            return;
        }

        // Event Delegation: ผูก click event กับ keypad container
        keypad.addEventListener('click', handleKeypadClick);

        // Keyboard support: ผูก keydown event กับ document
        document.addEventListener('keydown', handleKeyboardInput);

        // อัปเดต display เริ่มต้น
        updateDisplay();

        // Log สำหรับ debugging (สามารถลบได้ใน production)
        console.log('Calculator initialized successfully');
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    // เรียก initCalculator เมื่อ DOM โหลดเสร็จ
    
    // ตรวจสอบว่า DOM พร้อมหรือยัง
    if (document.readyState === 'loading') {
        // DOM ยังโหลดไม่เสร็จ รอ DOMContentLoaded
        document.addEventListener('DOMContentLoaded', initCalculator);
    } else {
        // DOM โหลดเสร็จแล้ว เริ่มต้นเลย
        initCalculator();
    }

})();
    