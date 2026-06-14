alert("JS is working!");

// Helper shortcut for getting DOM elements
const $ = (id) => document.getElementById(id);



/* ---------- INITIAL CONFIGURATION & CONSTANTS ---------- */
const PDF_FILENAME = "Medical and Accident Claim_Claimant's Statement_LF5191_202305_fillable.pdf";
const EMAIL_FIELDS = ["ClmMed_Insuredinfo_Email", "ClmMed_POinfo_Email"];
const CONTROLLER_BY_SECTION = { Policyownerinfo: "CB_PO" };

const basicPolicyMax = 4;
const basicPolicyGrid = $("basicPolicyGrid");
const addBasicPolicyBtn = $("addBasicPolicyBtn");

const maxOtherCoverage = 4;
const otherCoverageGrid = $("otherCoverageGrid");
const addOtherCoverageBtn = $("addOtherCoverageBtn");

/* ---------- DYNAMIC SUB-SECTIONS SHOW/HIDE INTERFACES ---------- */
function toggleIncidentSections() {
    const isIllness = $("optionIllness").checked;
    const isAccident = $("optionAccident").checked;
    $("illnesssection").style.display = isIllness ? "block" : "none";
    $("accidentsection").style.display = isAccident ? "block" : "none";
}

function initSectionToggles() {
    function setSectionEnabled(sectionEl, enabled) {
        if (!sectionEl) return;
        const inputs = sectionEl.querySelectorAll("input, select, textarea, button");
        inputs.forEach(el => el.disabled = !enabled);
        sectionEl.style.display = enabled ? "" : "none";
    }

    Object.entries(CONTROLLER_BY_SECTION).forEach(([sectionId, controllerId]) => {
        const controller = $(controllerId);
        const section = $(sectionId);
        if (controller && section) {
            const updateState = () => setSectionEnabled(section, controller.checked);
            controller.addEventListener("change", updateState);
            updateState();
        }
    });
}

/* ---------- KEYBOARD INTERFACES: AUTO-TAB LOGIC ENGINE ---------- */
function initAutoTabMechanics() {
    // Date input groups
    document.querySelectorAll('.date-group').forEach(group => {
        const inputs = group.querySelectorAll('.date-input');
        inputs.forEach((currentInput, index) => {
            const maxLength = parseInt(currentInput.getAttribute('maxlength'), 10);
            if (maxLength > 0) {
                currentInput.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    if (e.target.value.length === maxLength && index < inputs.length - 1) {
                        const nextInput = inputs[index + 1];
                        if (nextInput) {
                            nextInput.focus();
                            nextInput.select();
                        }
                    }
                });
            }
        });
    });

    // Time input groups
    document.querySelectorAll('.time-input-group').forEach(group => {
        const hourInput = group.querySelector('input[placeholder="HH"]');
        const minuteInput = group.querySelector('input[placeholder="MM"]');
        const ampmSelect = group.querySelector('select');

        if (hourInput && minuteInput) {
            hourInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                if (e.target.value.length === parseInt(e.target.maxLength, 10)) {
                    minuteInput.focus();
                    minuteInput.select();
                }
            });
            minuteInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                if (e.target.value.length === parseInt(e.target.maxLength, 10) && ampmSelect) {
                    ampmSelect.focus();
                }
            });
        }
    });
}

/* ---------- BUSINESS RULE DELEGATIONS: AGENT IS WITNESS ---------- */
const agentIsWitnessCheckbox = $('Clm_Agent_Is_Witness');
const agentNircContainer = $('agentNircContainer');
const fieldPairs = [
    { src: 'ClmMed_Basicinfo_Agent',     dest: 'ClmMed_Sign_Witness_Name' },
    { src: 'ClmMed_Basicinfo_Mobile',    dest: 'ClmMed_Sign_Witness_Mobile' },
    { src: 'ClmMed_Basicinfo_AgentNIRC',  dest: 'ClmMed_Sign_Witness_NIRC' }
];

function handleAgentWitnessLogic() {
    const isChecked = agentIsWitnessCheckbox.checked;
    agentNircContainer.style.display = isChecked ? 'block' : 'none';

    fieldPairs.forEach(pair => {
        const srcEl = $(pair.src);
        const destEl = $(pair.dest);
        if (isChecked) {
            destEl.value = srcEl.value;
            destEl.readOnly = true;
            destEl.classList.add('readonly-sync'); 
            destEl.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            destEl.readOnly = false;
            destEl.classList.remove('readonly-sync');
        }
    });
}

/* ---------- PERSISTENCE LOGIC (LOCALSTORAGE ENGINE) ---------- */
const saveStatusEl = $("saveStatus");

function showSaveStatus() {
    saveStatusEl.style.opacity = 1;
    clearTimeout(saveStatusEl._timer);
    saveStatusEl._timer = setTimeout(() => saveStatusEl.style.opacity = 0, 1200);
}

function saveElValue(el) {
    localStorage.setItem(el.id, el.value);
    showSaveStatus();
}

function autoBindSave(el) {
    const saved = localStorage.getItem(el.id);

    if (el.type === "checkbox") {
        if (saved !== null) el.checked = (saved === "true");
    } else if (el.type === "radio") {
        const savedRadioValue = localStorage.getItem(el.name);
        if (savedRadioValue) el.checked = (el.id === savedRadioValue);
    } else if (saved !== null) {
        el.value = saved;
    }

    if (el.tagName === "SELECT") {
        el.addEventListener("change", () => saveElValue(el));
    } else if (el.type === "checkbox") {
        el.addEventListener("change", () => {
            localStorage.setItem(el.id, el.checked);
            showSaveStatus();
        });
    } else if (el.type === "radio") {
        el.addEventListener("change", () => {
            if (el.checked) {
                localStorage.setItem(el.name, el.id);
                showSaveStatus();
            }
        });
    } else {
        el.addEventListener("input", () => {
            if (!EMAIL_FIELDS.includes(el.id)) {
                el.value = el.value.toUpperCase();
            }
            localStorage.setItem(el.id, el.value);
            showSaveStatus();
        });
    }
}

/* ---------- BASIC POLICY DYNAMIC LIST HANDLER ---------- */
function updateBasicPolicyAddStatus() {
    const count = basicPolicyGrid.querySelectorAll(".entry").length;
    addBasicPolicyBtn.disabled = count >= basicPolicyMax;
}

function createBasicPolicyEntry(index) {
    const entry = document.createElement("div");
    entry.className = "entry";
    entry.dataset.index = index;
    entry.innerHTML = `
        <h3>Policy No #${index}
            ${index > 1 ? `<button type="button" class="remove-btn">Remove</button>` : ""}
        </h3>
        <div class="row">
            <label style="flex:1">Policy Number
                <input type="text" class="persist" id="ClmMed_Basicinfo_PolicyNo${index}" 
                       placeholder="Enter policy no."
                       value="${localStorage.getItem("ClmMed_Basicinfo_PolicyNo" + index) || ""}">
            </label>
        </div>
    `;

    const input = entry.querySelector("input");
    input.addEventListener("input", (e) => {
        localStorage.setItem(e.target.id, e.target.value);
    });

    const removeBtn = entry.querySelector(".remove-btn");
    if (removeBtn) {
        removeBtn.addEventListener("click", () => {
            localStorage.removeItem(input.id);
            entry.remove();
            renumberBasicPolicyEntries();
            updateBasicPolicyAddStatus();
        });
    }

    basicPolicyGrid.appendChild(entry);
    updateBasicPolicyAddStatus();
}

function renumberBasicPolicyEntries() {
    const entries = basicPolicyGrid.querySelectorAll(".entry");
    entries.forEach((entry, i) => {
        const newIndex = i + 1;
        const oldInput = entry.querySelector("input");
        const oldId = oldInput.id;
        const newId = `ClmMed_Basicinfo_PolicyNo${newIndex}`;

        entry.querySelector("h3").childNodes[0].textContent = `Policy No #${newIndex} `;
        entry.dataset.index = newIndex;
        oldInput.id = newId;

        if (oldId !== newId) {
            const val = localStorage.getItem(oldId);
            if (val) {
                localStorage.setItem(newId, val);
                localStorage.removeItem(oldId);
            }
        }
    });
}

function restoreBasicPolicy() {
    basicPolicyGrid.innerHTML = "";
    let foundExisting = false;
    for (let i = 1; i <= basicPolicyMax; i++) {
        const savedVal = localStorage.getItem("ClmMed_Basicinfo_PolicyNo" + i);
        if (savedVal && savedVal.trim() !== "") {
            createBasicPolicyEntry(i);
            foundExisting = true;
        }
    }
    if (!foundExisting) createBasicPolicyEntry(1);
}

/* ---------- OTHER COVERAGE DYNAMIC CONTAINER HANDLER ---------- */
function createOtherCoverageEntry(index) {
    const entry = document.createElement("div");
    entry.className = "entry";
    entry.dataset.index = index;
    entry.innerHTML = `
        <h3>Other Coverage #${index} <button type="button" class="remove-btn">Remove</button></h3>
        <div class="row" style="flex:1">
            <label style="flex:1">Name of Company/Insurer/Scheme
            <input type="text" id="ClmMed_OtherCover_CompName${index}" value="${localStorage.getItem("ClmMed_OtherCover_CompName"+index) || ""}"></label>
        </div>
        <div class="row" style="flex:1">
            <label style="flex:1">Policy/Membership No.
            <input type="text" id="ClmMed_OtherCover_PolicyNo${index}" value="${localStorage.getItem("ClmMed_OtherCover_PolicyNo"+index) || ""}"></label>
        </div>
        <div class="row" style="flex:1">
            <label style="flex:1">Effective Date of Cover
            <input type="text" id="ClmMed_OtherCover_Date${index}" value="${localStorage.getItem("ClmMed_OtherCover_Date"+index) || ""}"></label>
            <label style="flex:1">Sum Assured
            <input type="text" id="ClmMed_OtherCover_FA${index}" value="${localStorage.getItem("ClmMed_OtherCover_FA"+index) || ""}"></label>
        </div>
    `;

    entry.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", e => localStorage.setItem(e.target.id, e.target.value));
    });

    entry.querySelector(".remove-btn").addEventListener("click", () => {
        entry.remove();
        updateOtherCoverageAddStatus();
    });

    otherCoverageGrid.appendChild(entry);
    updateOtherCoverageAddStatus();
}

function updateOtherCoverageAddStatus() {
    const currentCount = otherCoverageGrid.querySelectorAll(".entry").length;
    addOtherCoverageBtn.disabled = currentCount >= maxOtherCoverage;
}

function restoreOtherCoverage() {
    for (let i = 1; i <= maxOtherCoverage; i++) {
        if (localStorage.getItem("ClmMed_OtherCover_CompName" + i) ||
            localStorage.getItem("ClmMed_OtherCover_PolicyNo" + i) ||
            localStorage.getItem("ClmMed_OtherCover_Date" + i) ||
            localStorage.getItem("ClmMed_OtherCover_FA" + i)) {
            createOtherCoverageEntry(i);
        }
    }
}

/* ---------- UNIVERSAL DATA FIELD DELEGATE AUTOMATIONS ---------- */
function autoLinkPersonFields(config) {
    const { trigger, sourceA, sourceB, targets, alwaysReadOnly } = config;

    function restoreTargets() {
        targets.forEach(t => {
            ["name", "nirc", "mobile"].forEach(key => {
                if (!t[key]) return;
                const el = $(t[key]);
                const saved = localStorage.getItem(t[key]);
                if (el && saved !== null) el.value = saved;
                if (alwaysReadOnly && el) el.readOnly = true;
            });
        });
    }

    function applyLinking() {
        const cb = trigger ? $(trigger) : null;
        const src = cb?.checked ? sourceB : sourceA;

        const srcName  = $(src.name)?.value || "";
        const srcNirc  = $(src.nirc)?.value || "";
        const srcMobile = src.mobile ? ($(src.mobile)?.value || "") : "";

        targets.forEach(t => {
            if (t.name) {
                const el = $(t.name);
                if (el) { el.value = srcName; localStorage.setItem(t.name, srcName); if (alwaysReadOnly) el.readOnly = true; }
            }
            if (t.nirc) {
                const el = $(t.nirc);
                if (el) { el.value = srcNirc; localStorage.setItem(t.nirc, srcNirc); if (alwaysReadOnly) el.readOnly = true; }
            }
            if (t.mobile) {
                const el = $(t.mobile);
                if (el) { el.value = srcMobile; localStorage.setItem(t.mobile, srcMobile); if (alwaysReadOnly) el.readOnly = true; }
            }
        });
        showSaveStatus();
    }

    if (trigger) $(trigger)?.addEventListener("change", applyLinking);

    [sourceA, sourceB].forEach(src => {
        ["name", "nirc", "mobile"].forEach(key => {
            if (!src[key]) return;
            $(src[key])?.addEventListener("input", applyLinking);
        });
    });

    restoreTargets();
    applyLinking();
}

function initDateAndTimeGroupCombiners() {
    document.querySelectorAll('.date-group[data-combine="true"]').forEach(group => {
        const fieldId = group.dataset.field;
        const inputs = group.querySelectorAll(".date-input");

        const saved = localStorage.getItem(fieldId);
        if (saved) {
            const [d, m, y] = saved.split("/");
            if (inputs[0]) inputs[0].value = d || "";
            if (inputs[1]) inputs[1].value = m || "";
            if (inputs[2]) inputs[2].value = y || "";
        }

        inputs.forEach(input => {
            input.addEventListener("input", () => {
                const [d, m, y] = Array.from(inputs).map(i => i.value.trim());
                const combined = [d, m, y].filter(Boolean).join("/");
                localStorage.setItem(fieldId, combined);
            });
        });
    });

    document.querySelectorAll(".time-input-group[data-field]").forEach(group => {
        const fieldId = group.dataset.field;
        const hourInput = group.querySelector('input[placeholder="HH"]');
        const minuteInput = group.querySelector('input[placeholder="MM"]');
        const ampmSelect = group.querySelector("select");

        const saved = localStorage.getItem(fieldId);
        if (saved) {
            const [time, period] = saved.split(" ");
            if (time) {
                const [hh, mm] = time.split(":");
                if (hourInput) hourInput.value = hh || "";
                if (minuteInput) minuteInput.value = mm || "";
            }
            if (ampmSelect) ampmSelect.value = period || "";
        }

        const saveTime = () => {
            const hh = hourInput.value.trim().padStart(2, "0");
            const mm = minuteInput.value.trim().padStart(2, "0");
            const ampm = ampmSelect.value;
            const combined = (hh || mm || ampm) ? `${hh}:${mm} ${ampm}`.trim() : "";
            localStorage.setItem(fieldId, combined);
        };

        [hourInput, minuteInput, ampmSelect].forEach(el => {
            el.addEventListener("input", saveTime);
            el.addEventListener("change", saveTime);
        });
    });
}

/* ---------- SECURE SIGNATURE MODAL CANVAS ENGINE ---------- */
let sigTarget = null;
const sigModal = $("sigModal");
const sigCanvas = $("sigCanvas");
const sigCtx = sigCanvas.getContext("2d");
let drawing = false;
let scaleX = 1, scaleY = 1;

function resizeSigCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = sigCanvas.clientWidth || sigCanvas.parentElement.clientWidth || 560;
    const cssHeight = sigCanvas.clientHeight || 220;
    sigCanvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    sigCanvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    sigCtx.setTransform(1,0,0,1,0,0);
    sigCtx.scale(dpr, dpr);
    sigCtx.lineWidth = 2;
    sigCtx.lineCap = "round";
    sigCtx.strokeStyle = "#000";
    scaleX = sigCanvas.width / (sigCanvas.getBoundingClientRect().width || cssWidth);
    scaleY = sigCanvas.height / (sigCanvas.getBoundingClientRect().height || cssHeight);
}

function openSig(target) {
    sigTarget = target;
    if (target === 'simple_owner') $("sigModalTitle").textContent = "Sign: Policy Owner";
    else if (target === 'simple_witness') $("sigModalTitle").textContent = "Sign: Witness";
    else if (target === 'simple_assignee') $("sigModalTitle").textContent = "Sign: Trustee";

    sigModal.style.display = "block";
    sigModal.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        resizeSigCanvas();
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        const existing = localStorage.getItem("sig_" + target);
        if (existing) {
            const img = new Image();
            img.onload = () => {
                sigCtx.drawImage(img, 0, 0, sigCanvas.width / scaleX, sigCanvas.height / scaleY);
            };
            img.src = existing;
        }
    });
}

function closeSigModal() {
    sigModal.style.display = "none";
    sigModal.setAttribute("aria-hidden", "true");
    sigTarget = null;
}

function getPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
        return { x: (e.touches[0].clientX - rect.left), y: (e.touches[0].clientY - rect.top) };
    }
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
}

function startDraw(e) {
    drawing = true;
    sigCtx.beginPath();
    const { x, y } = getPos(e);
    sigCtx.moveTo(x, y);
    if (e.preventDefault) e.preventDefault();
}

function moveDraw(e) {
    if (!drawing) return;
    const { x, y } = getPos(e);
    sigCtx.lineTo(x, y);
    sigCtx.stroke();
    sigCtx.beginPath();
    sigCtx.moveTo(x, y);
    if (e.preventDefault) e.preventDefault();
}

function initSignatureEngineMechanics() {
    $("preview_simple_owner").addEventListener("click", () => openSig('simple_owner'));
    $("preview_simple_witness").addEventListener("click", () => openSig('simple_witness'));
    $("preview_simple_assignee").addEventListener("click", () => openSig('simple_assignee'));

    $("sigClear").addEventListener("click", () => sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height));
    $("sigCancel").addEventListener("click", closeSigModal);
    $("sigDone").addEventListener("click", () => {
        if (!sigTarget) return;
        const dataURL = sigCanvas.toDataURL("image/png");
        localStorage.setItem("sig_" + sigTarget, dataURL);
        $("preview_" + sigTarget).innerHTML = `<img alt="Signature ${sigTarget}" src="${dataURL}">`;
        closeSigModal();
    });

    sigCanvas.addEventListener("mousedown", startDraw);
    sigCanvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", () => { drawing = false; sigCtx.beginPath(); });
    sigCanvas.addEventListener("touchstart", startDraw, { passive: false });
    sigCanvas.addEventListener("touchmove", moveDraw, { passive: false });
    sigCanvas.addEventListener("touchend", () => { drawing = false; sigCtx.beginPath(); });

    $("clearPreview_Simple_Owner").addEventListener("click", () => {
        localStorage.removeItem("sig_simple_owner");
        $("preview_simple_owner").innerHTML = `<span>Tap to Sign (Policyowner/Assignee)</span>`;
    });
    $("clearPreview_Simple_Witness").addEventListener("click", () => {
        localStorage.removeItem("sig_simple_witness");
        $("preview_simple_witness").innerHTML = `<span>Tap to Sign (Witness)</span>`;
    });
    $("clearPreview_Simple_Assignee").addEventListener("click", () => {
        localStorage.removeItem("sig_simple_assignee");
        $("preview_simple_assignee").innerHTML = `<span>Tap to Sign (Trustee/Nominee)</span>`;
    });

    ["owner", "witness", "assignee"].forEach(role => {
        const saved = localStorage.getItem("sig_simple_" + role);
        if (saved) { $("preview_simple_" + role).innerHTML = `<img alt="Signature ${role}" src="${saved}">`; }
    });
}

/* ---------- TABULAR APPLICATION WIZARD TRACKER MECHANICS ---------- */
const steps = document.querySelectorAll(".wizard-step");
const indicatorSteps = document.querySelectorAll(".step");
const nextBtn = $("nextBtn");
const prevBtn = $("prevBtn");
let currentStep = 0;

function navigateTo(index) {
    steps[currentStep].classList.remove("active");
    indicatorSteps[currentStep].classList.remove("active");
    currentStep = index;
    steps[currentStep].classList.add("active");
    indicatorSteps[currentStep].classList.add("active");

    prevBtn.style.visibility = (currentStep === 0) ? "hidden" : "visible";
    if (currentStep === steps.length - 1) {
        nextBtn.style.display = "none";
    } else {
        nextBtn.style.display = "block";
        nextBtn.innerText = "Next Step";
    }
    document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
}

function initWizardNavigation() {
    indicatorSteps.forEach((stepCircle, index) => {
        stepCircle.addEventListener("click", () => navigateTo(index));
    });
    nextBtn.addEventListener("click", () => { if (currentStep < steps.length - 1) navigateTo(currentStep + 1); });
    prevBtn.addEventListener("click", () => { if (currentStep > 0) navigateTo(currentStep - 1); });
}

/* ---------- FORM DATA INJECTION RULES FILTER ENGINE ---------- */
function shouldIncludeFieldByUI(fieldId) {
    const el = $(fieldId);
    if (!el) return true;
    let parent = el;
    while (parent && parent !== document.body) {
        if (parent.id && CONTROLLER_BY_SECTION[parent.id]) {
            const controllerId = CONTROLLER_BY_SECTION[parent.id];
            const cb = $(controllerId);
            if (cb && !cb.checked) return false;
        }
        parent = parent.parentElement;
    }
    return true;
}

function safeSetField(form, fieldName, value) {
    if (value === null || value === undefined) return;
    try {
        let field;
        try {
            field = form.getTextField(fieldName);
            if (!EMAIL_FIELDS.includes(fieldName)) field.setText(value.toUpperCase());
            else field.setText(value);
            return;
        } catch (e) {}

        try { field = form.getDropdown(fieldName); field.select(value); return; } catch (e) {}

        try {
            field = form.getCheckBox(fieldName);
            if (value === true || value === "true" || value === "on" || value === "checked") field.check();
            else field.uncheck();
            return;
        } catch (e) {}
        
        try { field = form.getRadioGroup(fieldName); field.select(value); return; } catch (e) {}
        console.warn(`Field ${fieldName} not found in PDF`);
    } catch (err) {
        console.error(`Error setting field ${fieldName}`, err);
    }
}

/* ---------- DIGITAL PDF TRANSLATION & GENERATION RUNTIME ---------- */
async function fillPDF() {
    try {
        $("generate").disabled = true;
        const res = await fetch(PDF_FILENAME);
        if (!res.ok) throw new Error("Cannot load PDF: " + PDF_FILENAME);
        const bytes = await res.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
        const form = pdfDoc.getForm();
        const page = pdfDoc.getPages()[3];

        const fieldNames = [
            "ClmMed_Basicinfo_PolicyNo1","ClmMed_Basicinfo_PolicyNo2","ClmMed_Basicinfo_PolicyNo3","ClmMed_Basicinfo_PolicyNo4",
            "ClmMed_Basicinfo_Day","ClmMed_Basicinfo_Month","ClmMed_Basicinfo_Year","ClmMed_Basicinfo_Agent","ClmMed_Basicinfo_Agency","ClmMed_Basicinfo_Mobile",
            "ClmMed_Claimtype_Hosp","ClmMed_Claimtype_PrePost","ClmMed_Claimtype_HospBen","ClmMed_Claimtype_OpDengue","ClmMed_Claimtype_OpKidney","ClmMed_Claimtype_Home","ClmMed_Claimtype_AccInjury","ClmMed_Claimtype_AccIndemnity","ClmMed_Claimtype_Others","ClmMed_Claimtype_Others_Text","ClmMed_Claimtype_Amt",
            "ClmMed_Insuredinfo_Name","ClmMed_Insuredinfo_NIRC","ClmMed_Insuredinfo_Mobile","ClmMed_Insuredinfo_Email","ClmMed_Insuredinfo_Add","ClmMed_Insuredinfo_Occupation","ClmMed_Insuredinfo_Duties","ClmMed_Insuredinfo_Employer","ClmMed_Insuredinfo_EmployerAdd",
            "ClmMed_POinfo_Name","ClmMed_POinfo_NIRC","ClmMed_POinfo_Mobile","ClmMed_POinfo_Email","ClmMed_POinfo_Add",
            "ClmMed_Illness_Nature","ClmMed_Illness_Sympton","ClmMed_Illness_Diagnosis_Month","ClmMed_Illness_Diagnosis_Year","ClmMed_Illness_Onset_Month","ClmMed_Illness_Diagnosis_Day",
            "ClmMed_Accident_Day","ClmMed_Accident_Month","ClmMed_Illness_Onset_Year","ClmMed_Accident_Time","ClmMed_Accident_AM","ClmMed_Accident_PM","ClmMed_Accident_Place","ClmMed_Accident_How","ClmMed_Accident_Injury","ClmMed_Illness_Onset_Day","ClmMed_Accident_AbsentDay","ClmMed_Accident_Year","ClmMed_Accident_ReturnDay","ClmMed_Accident_AbsentMonth","ClmMed_Accident_ReturnMonth","ClmMed_Accident_AbsentYear","ClmMed_Accident_ReturnYear",
            "ClmMed_Dr_First_Date","ClmMed_Dr_First_NameAdd","ClmMed_Dr_Others_NameAdd","ClmMed_Dr_Others_Date","ClmMed_Dr_Regular_Date","ClmMed_Dr_Regular_NameAdd","ClmMed_Dr_5yrs_Date","ClmMed_Dr_5yrs_NameAdd",
            "ClmMed_OtherCover_CompName1","ClmMed_OtherCover_CompName2","ClmMed_OtherCover_CompName3","ClmMed_OtherCover_CompName4","ClmMed_OtherCover_PolicyNo1","ClmMed_OtherCover_PolicyNo2","ClmMed_OtherCover_PolicyNo3","ClmMed_OtherCover_PolicyNo4","ClmMed_OtherCover_Date1","ClmMed_OtherCover_Date2","ClmMed_OtherCover_Date3","ClmMed_OtherCover_Date4","ClmMed_OtherCover_FA1","ClmMed_OtherCover_FA2","ClmMed_OtherCover_FA3","ClmMed_OtherCover_FA4",
            "ClmMed_EBank_Name","ClmMed_EBank_NIRC","ClmMed_EBank_AccNo","ClmMed_EBank_Bank",
            "ClmMed_Sign_Witness_Name","ClmMed_Sign_Witness_NIRC","ClmMed_Sign_Witness_Date","ClmMed_Sign_Witness_Mobile",
            "ClmMed_Sign_PO_Name","ClmMed_Sign_PO_NIRC","ClmMed_Sign_PO_Date","ClmMed_Sign_Relationship","ClmMed_Sign_Relationship_Mobile"
        ];

        fieldNames.forEach(fieldName => {
            if (!shouldIncludeFieldByUI(fieldName)) return;
            safeSetField(form, fieldName, localStorage.getItem(fieldName));
        });

        // Conventional/Islamic Radio Setup
        const selectedBankType = localStorage.getItem("Accounttype");
        try {
            const conv = form.getCheckBox("ClmMed_EBank_Conventional");
            const isl  = form.getCheckBox("ClmMed_EBank_Islamic");
            if (selectedBankType === "ClmMed_EBank_Conventional") conv.check(); else conv.uncheck();
            if (selectedBankType === "ClmMed_EBank_Islamic") isl.check(); else isl.uncheck();
        } catch (e) {}

        // Signature Embedding Mechanics
        const sigRoles = [
            { key: "sig_simple_owner", elId: "preview_simple_owner", x: 370, y: 200 },
            { key: "sig_simple_witness", elId: "preview_simple_witness", x: 70, y: 200 },
            { key: "sig_simple_assignee", elId: "preview_simple_assignee", x: 230, y: 620 }
        ];

        for (const role of sigRoles) {
            const dataStr = localStorage.getItem(role.key);
            if (dataStr) {
                try {
                    const embeddedImg = await pdfDoc.embedPng(dataStr);
                    const { width, height } = embeddedImg.size();
                    const previewEl = $(role.elId);
                    const scale = Math.min(previewEl.offsetWidth / width, previewEl.offsetHeight / height) * 0.40;
                    page.drawImage(embeddedImg, { x: role.x, y: role.y, width: width * scale, height: height * scale });
                } catch (err) { console.error("Error drawing sig signature image: ", err); }
            }
        }

        const pdfBytes = await pdfDoc.save();
        const policyNum = $("ClmMed_Basicinfo_PolicyNo1")?.value.trim() || "NEW";
        const finalFileName = `${policyNum.replace(/[^a-z0-9]/gi, '_')}_Medical_Accidental_Claim.pdf`;

        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2500);
    } catch(err) {
        alert("PDF generation failed: " + (err.message || err));
    } finally {
        $("generate").disabled = false;
    }
}

function resetAll() {
    if (!confirm("Are you sure you want to reset the form? All saved data will be cleared.")) return;
    localStorage.clear();
    document.querySelectorAll("input, select, textarea").forEach(el => {
        if (!el.id) return;
        if (el.type === "checkbox" || el.type === "radio") el.checked = false;
        else el.value = "";
    });
    $("preview_simple_owner").innerHTML = `<span>Tap to Sign (Policyowner/Assignee)</span>`;
    $("preview_simple_witness").innerHTML = `<span>Tap to Sign (Witness)</span>`;
    $("preview_simple_assignee").innerHTML = `<span>Tap to Sign (Trustee/Nominee)</span>`;
    showSaveStatus();
}

/* ---------- LIFE-CYCLE INITIALIZATION MOUNTING ---------- */
document.addEventListener("DOMContentLoaded", () => {
    checkAuthGuard();
    initSectionToggles();
    initAutoTabMechanics();
    initSignatureEngineMechanics();
    initWizardNavigation();
    initDateAndTimeGroupCombiners();

    // Event delegation hooks for Dynamic Radios & Checkboxes
    $("optionIllness").addEventListener("change", toggleIncidentSections);
    $("optionAccident").addEventListener("change", toggleIncidentSections);
    toggleIncidentSections();

    if (!localStorage.getItem("IncidentType")) {
        $("optionIllness").checked = false;
        $("optionAccident").checked = false;
    }

    // Agent witness link live synchronizations
    agentIsWitnessCheckbox.addEventListener('change', handleAgentWitnessLogic);
    fieldPairs.forEach(pair => {
        $(pair.src).addEventListener('input', () => {
            if (agentIsWitnessCheckbox.checked) handleAgentWitnessLogic();
        });
    });
    setTimeout(handleAgentWitnessLogic, 300);

    // Enforce bank type true radio behavior manually
    document.querySelectorAll("input.bank-type").forEach(el => {
        el.addEventListener("change", () => {
            const conventional = $("ClmMed_EBank_Conventional");
            const islamic = $("ClmMed_EBank_Islamic");
            if (el.id === "ClmMed_EBank_Conventional") islamic.checked = false;
            else conventional.checked = false;
            if (el.checked) localStorage.setItem("Accounttype", el.id);
        });
    });
    const savedBankType = localStorage.getItem("Accounttype");
    if (savedBankType && $(savedBankType)) $(savedBankType).checked = true;

    // Attach dynamic collections additions
    addBasicPolicyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const count = basicPolicyGrid.querySelectorAll(".entry").length;
        if (count < basicPolicyMax) createBasicPolicyEntry(count + 1);
    });
    restoreBasicPolicy();

    addOtherCoverageBtn.addEventListener("click", () => {
        const currentCount = otherCoverageGrid.querySelectorAll(".entry").length;
        createOtherCoverageEntry(currentCount + 1);
    });
    restoreOtherCoverage();

    // Auto-bind input updates across all element decorators containing class '.persist'
    document.querySelectorAll(".persist").forEach(autoBindSave);

    // Run late-bound field data dependencies syncing
    setTimeout(() => {
        autoLinkPersonFields({
            trigger: "CB_PO",
            sourceA: { name: "ClmMed_Insuredinfo_Name", nirc: "ClmMed_Insuredinfo_NIRC", mobile: "ClmMed_Insuredinfo_Mobile" },
            sourceB: { name: "ClmMed_POinfo_Name", nirc: "ClmMed_POinfo_NIRC", mobile: "ClmMed_POinfo_Mobile" },
            targets: [
                { name: "ClmMed_EBank_Name", nirc: "ClmMed_EBank_NIRC" },
                { name: "ClmMed_Sign_PO_Name", nirc: "ClmMed_Sign_PO_NIRC", mobile: "ClmMed_Sign_Relationship_Mobile" }
            ],
            alwaysReadOnly: true
        });
    }, 50);

    // Operational Actions Form Links
    $("generate").addEventListener("click", fillPDF);
    $("resetAll").addEventListener("click", resetAll);
    $("navLogo").addEventListener("click", () => { window.location.href = "dashboard.html"; });
    $("menuToggle").addEventListener("click", () => { $("navMenu").classList.toggle('show'); });

    // Scroll to Top UI Mechanics Toggle
    window.addEventListener("scroll", () => {
        const btn = $("scrollTopBtn");
        if (document.documentElement.scrollTop > 200 || document.body.scrollTop > 200) {
            btn.classList.add("show");
        } else {
            btn.classList.remove("show");
        }
    });
    $("scrollTopBtn").addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }); });

    // Universal "Set to Today" Logic handler
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-set-today')) {
            e.preventDefault();
            const prefix = e.target.getAttribute('data-target');
            const now = new Date();
            const dateData = {
                Day: String(now.getDate()).padStart(2, '0'),
                Month: String(now.getMonth() + 1).padStart(2, '0'),
                Year: String(now.getFullYear())
            };
            ['Day', 'Month', 'Year'].forEach(part => {
                const input = $(`${prefix}_${part}`);
                if (input) {
                    input.value = dateData[part];
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }
    });
});
