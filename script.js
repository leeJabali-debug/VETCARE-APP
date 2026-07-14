/**
 * VetCare Portal - Core State Engine & View Router Middleware Matrix
 * Designed for single-page standalone DOM execution with LocalStorage persistence layers.
 */

// --- INITIAL CONTEXT DATA MOCKS (Clinics, Specialists, Stores, Backgrounds) ---
const ANIMAL_PHOTOS = [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200", // Retriever
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200", // Cat
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200", // Shiba
    "https://images.unsplash.com/photo-1537151608828-ea2b117b6b86?auto=format&fit=crop&q=80&w=1200"  // Corgi Mix
];

const INITIAL_CLINICS = [
    {
        id: "clinic-1",
        name: "VetCare Central Hospital & 24/7 ER",
        address: "410 Medical Center Blvd (Block 4A)",
        contact: "+1 (555) 892-0192",
        mapX: 200, mapY: 100,
        vets: [
            { id: "vet-1", name: "Dr. Sarah Chen, DVM", exp: 12, treatments: 1420, reviews: ["Brilliant surgeon!", "Handled my anxious cat perfectly."] },
            { id: "vet-2", name: "Dr. Marcus Miller, DVM", exp: 8, treatments: 980, reviews: ["Extremely detailed explanations.", "Very professional."] }
        ]
    },
    {
        id: "clinic-2",
        name: "Northside Exotic & Aquatic Clinic",
        address: "892 Pipeline Channels Way",
        contact: "+1 (555) 341-7788",
        mapX: 600, mapY: 280,
        vets: [
            { id: "vet-3", name: "Dr. Marissa Vance, DVM", exp: 15, treatments: 2100, reviews: ["The best avian specialist in town.", "Incredible knowledge."] }
        ]
    }
];

const PET_STORES = [
    { id: "store-1", name: "Paws & Premium Kibble Depot", address: "102 Broadway Avenue", contact: "(555) 111-2222", hours: "08:00 AM - 09:00 PM", stock: ["Organic Turkey Kibbles", "Orthopedic Dog Beds", "Cat Nip Toys"] },
    { id: "store-2", name: "VetCare Certified Pharmacy & Feeds", address: "412 Medical Center Blvd (Suite B)", contact: "(555) 111-3333", hours: "Open 24 Hours", stock: ["Flea Treatments", "Herbal Medicated Wash", "Hypoallergenic Treats"] },
    { id: "store-3", name: "Aquatic Hub & Reptile Supplies", address: "55 Marina Transit Pier", contact: "(555) 444-5555", hours: "09:00 AM - 06:00 PM", stock: ["UVB Thermostat Bulbs", "Water Conditioners", "Exotic Foraging Logs"] }
];

// --- GLOBAL APPLICATION STATE LAYER ---
let state = {
    userSession: null,      // Holds: { role, username, email, age, workplace, verified }
    isLoginMode: false,     // Toggles Sign Up vs Log In
    pets: [],               // Array of Pet objects: { id, name, species, breed, age, weight, photo, notes: [] }
    activePetId: null,
    activeNoteId: null,
    appointments: [],       // Array of: { id, clinicId, clinicName, date, time, reason, status, assignedVet, petName }
    selectedClinicId: null, // Selected clinic inside Finder tab
    selectedScheduleDate: null,
    selectedScheduleTime: null,
    pendingShareNote: null, // Holds note metadata if in transit transmission mode
    activeChatId: "dr-buddy", // Default to AI system channel
    chatMessages: [
        { id: "m1", senderId: "dr-buddy", receiverId: "all", text: "Hello! I am Dr. Buddy, your automated AI clinical advisor. Select a companion file to analyze symptoms or prepare for clinic workflows.", timestamp: "Now" }
    ]
};

// --- DATA INITIALIZATION & LOCALSTORAGE BOUNDS ---
function loadStateFromStorage() {
    const storedSession = localStorage.getItem("vetcare_session");
    const storedPets = localStorage.getItem("vetcare_pets");
    const storedAppointments = localStorage.getItem("vetcare_appointments");
    
    if (storedSession) state.userSession = JSON.parse(storedSession);
    if (storedPets) {
        state.pets = JSON.parse(storedPets);
    } else {
        // Pre-populate dummy pet context for testing workspace ease
        state.pets = [{
            id: "pet-demo",
            name: "Max",
            species: "Dog",
            breed: "Golden Retriever",
            age: 3,
            weight: 32,
            photo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200",
            notes: [
                { id: "note-demo", title: "Dietary Adjustments", body: "Switched to organic kibble. Logged minor rash behind the left ears after initial feedings." }
            ]
        }];
    }
    if (storedAppointments) state.appointments = JSON.parse(storedAppointments);

    if (state.pets.length > 0) {
        state.activePetId = state.pets[0].id;
        if (state.pets[0].notes.length > 0) state.activeNoteId = state.pets[0].notes[0].id;
    }
}

function saveStateToStorage() {
    localStorage.setItem("vetcare_session", JSON.stringify(state.userSession));
    localStorage.setItem("vetcare_pets", JSON.stringify(state.pets));
    localStorage.setItem("vetcare_appointments", JSON.stringify(state.appointments));
}

// --- CORE CORE RENDER SYSTEMS ENGINE ---
function initializeApp() {
    loadStateFromStorage();
    setupBackgroundSlider();
    setupEventListeners();
    routeViewDisplay();
    renderAllViews();
}

// 6-Second Background Rotator Layout Logic
function setupBackgroundSlider() {
    const slider = document.getElementById("bg-slider");
    let index = 0;
    slider.style.backgroundImage = `url('${ANIMAL_PHOTOS[index]}')`;
    setInterval(() => {
        index = (index + 1) % ANIMAL_PHOTOS.length;
        slider.style.opacity = "0.1";
        setTimeout(() => {
            slider.style.backgroundImage = `url('${ANIMAL_PHOTOS[index]}')`;
            slider.style.opacity = "1";
        }, 1000);
    }, 6000);
}

// Global View routing state switcher matrix
function routeViewDisplay() {
    const onboardingGate = document.getElementById("onboarding-gate");
    const appWorkspace = document.getElementById("app-workspace");

    if (!state.userSession) {
        onboardingGate.classList.remove("hidden");
        appWorkspace.classList.add("hidden");
        renderOnboardingForm();
    } else {
        onboardingGate.classList.add("hidden");
        appWorkspace.classList.remove("hidden");
        
        // Handle Header components alignment
        document.getElementById("session-display-name").innerText = state.userSession.username;
        document.getElementById("session-display-meta").innerText = `${state.userSession.role === 'vet' ? 'Licensed Vet' : 'Pet Owner'} • ${state.userSession.age} y/o`;
        
        // Show/Hide Vet Portal tab depending on clearance level
        const vetTab = document.getElementById("vet-portal-tab");
        if (state.userSession.role === "vet" && state.userSession.verified) {
            vetTab.classList.remove("hidden");
        } else {
            vetTab.classList.add("hidden");
        }
    }
}

function switchTab(targetTabId) {
    document.querySelectorAll(".tab-view").forEach(view => view.classList.add("hidden"));
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("bg-slate-800", "text-white");
        btn.classList.add("text-slate-400");
    });

    const targetView = document.getElementById(`view-${targetTabId}`);
    if (targetView) targetView.classList.remove("hidden");
    
    const activeBtn = document.querySelector(`[data-tab="${targetTabId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove("text-slate-400");
        activeBtn.classList.add("bg-slate-800", "text-white");
    }

    // Transit triggers inside target environments mapping
    if (targetTabId === "vet-finder") renderVetFinderTab();
    if (targetTabId === "appointments") renderAppointmentsTab();
    if (targetTabId === "vet-portal") renderVetPortalTab();
}

// --- RENDER EXECUTION PER TAB ---
function renderAllViews() {
    if (!state.userSession) return;
    renderMyPetsTab();
    renderPetStoresTab();
    renderChatWidget();
}

// VIEW 1: MY PETS & HEALTH NOTEPAD RENDERING
function renderMyPetsTab() {
    const container = document.getElementById("pets-list-container");
    container.innerHTML = "";

    state.pets.forEach(pet => {
        const isActive = pet.id === state.activePetId;
        const div = document.createElement("div");
        div.className = `p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isActive ? 'bg-teal-500/10 border-teal-500 text-white' : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 text-slate-300'}`;
        div.onclick = () => {
            state.activePetId = pet.id;
            // Auto-select first note of pet if exists
            state.activeNoteId = pet.notes.length > 0 ? pet.notes[0].id : null;
            renderMyPetsTab();
        };

        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${pet.photo || 'https://via.placeholder.com/40'}" class="w-9 h-9 rounded-full object-cover border border-slate-700">
                <div>
                    <h4 class="text-xs font-bold">${pet.name}</h4>
                    <p class="text-[10px] text-slate-400">${pet.breed}</p>
                </div>
            </div>
            <span class="text-xs opacity-60">${pet.species === 'Dog' ? '🐶' : '🐱'}</span>
        `;
        container.appendChild(div);
    });

    // Render active profile banner workspace card
    const activePet = state.pets.find(p => p.id === state.activePetId);
    const banner = document.getElementById("active-pet-banner");
    
    if (activePet) {
        banner.innerHTML = `
            <img src="${activePet.photo || 'https://via.placeholder.com/80'}" class="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500/40 shadow-md">
            <div class="flex-1 space-y-1">
                <div class="flex items-center space-x-2">
                    <h2 class="text-xl font-black text-white">${activePet.name}</h2>
                    <span class="bg-teal-500/20 text-teal-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">${activePet.species}</span>
                </div>
                <p class="text-xs text-slate-400">Breed File: <strong class="text-slate-200">${activePet.breed}</strong></p>
                <div class="flex space-x-4 text-xs pt-1">
                    <span class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">📅 <strong>${activePet.age}</strong> Years Old</span>
                    <span class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">⚖️ <strong>${activePet.weight}</strong> kg</span>
                </div>
            </div>
        `;
        renderNotepadSpace(activePet);
    } else {
        banner.innerHTML = `<p class="text-sm text-slate-500 py-4 text-center w-full">No pet profiles established inside local sandbox context yet.</p>`;
        document.getElementById("notes-sidebar-list").innerHTML = "";
    }
}

// Health Notepad Component Logic Engine
function renderNotepadSpace(pet) {
    const sidebar = document.getElementById("notes-sidebar-list");
    sidebar.innerHTML = "";

    pet.notes.forEach(note => {
        const isNoteActive = note.id === state.activeNoteId;
        const item = document.createElement("div");
        item.className = `p-2 rounded-lg text-xs flex justify-between items-center group transition-all cursor-pointer ${isNoteActive ? 'bg-amber-500/20 text-amber-200 font-bold' : 'text-slate-400 hover:bg-slate-900/40'}`;
        
        // Inline sidebar deletion workflow component logic
        item.innerHTML = `
            <span class="truncate flex-1 mr-2" onclick="state.activeNoteId='${note.id}'; renderMyPetsTab();">${note.title || 'Untitled Page'}</span>
            <button class="opacity-0 group-hover:opacity-100 text-red-400 text-[10px] hover:underline" onclick="triggerInlineNoteDelete(event, '${note.id}')">🗑️</button>
        `;
        sidebar.appendChild(item);
    });

    const activeNote = pet.notes.find(n => n.id === state.activeNoteId);
    const titleInput = document.getElementById("note-title");
    const bodyArea = document.getElementById("note-body");

    if (activeNote) {
        titleInput.value = activeNote.title;
        bodyArea.value = activeNote.body;
    } else {
        titleInput.value = "";
        bodyArea.value = "";
    }
}

// VIEW 2: VET LOCATE & MAP EXPLORATION RENDERING
function renderVetFinderTab() {
    const pinsLayer = document.getElementById("map-pins-layer");
    const catalog = document.getElementById("clinics-list");
    pinsLayer.innerHTML = "";
    catalog.innerHTML = "";

    INITIAL_CLINICS.forEach(clinic => {
        const isFocused = clinic.id === state.selectedClinicId;

        // Render vector positioning elements
        const pin = document.createElement("div");
        pin.className = `absolute w-4 h-4 -ml-2 -mt-2 rounded-full cursor-pointer transition-all ${isFocused ? 'bg-teal-400 shadow-[0_0_12px_#2dd4bf] scale-125 z-30' : 'bg-slate-700 hover:bg-teal-500 z-20'}`;
        pin.style.left = `${clinic.mapX / 8}%`; // Basic bounding calculation mapping projection fallback
        pin.style.top = `${clinic.mapY / 4}%`;
        pin.title = clinic.name;
        pin.onclick = () => {
            state.selectedClinicId = clinic.id;
            renderVetFinderTab();
        };
        pinsLayer.appendChild(pin);

        // Render card lists component element
        const card = document.createElement("div");
        card.className = `p-4 rounded-xl border text-left transition-all cursor-pointer ${isFocused ? 'bg-slate-900 border-teal-500/50 shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900'}`;
        card.onclick = () => {
            state.selectedClinicId = clinic.id;
            renderVetFinderTab();
        };
        card.innerHTML = `
            <h3 class="text-sm font-bold text-white flex items-center justify-between">
                <span>🏥 ${clinic.name}</span>
                <span class="text-[10px] text-slate-500">Coordinate Grid</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">${clinic.address}</p>
            <p class="text-[11px] text-teal-400/80 mt-2">📞 ${clinic.contact}</p>
        `;
        catalog.appendChild(card);
    });

    // Populate Right Specific Clinic In-Depth Profiling Panel
    const activeClinic = INITIAL_CLINICS.find(c => c.id === state.selectedClinicId);
    const focusPanel = document.getElementById("clinic-focus-panel");

    if (activeClinic) {
        let vetListHTML = "";
        activeClinic.vets.forEach(vet => {
            vetListHTML += `
                <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-xs font-bold text-white">${vet.name}</h4>
                            <p class="text-[10px] text-slate-400">Experience span: <strong>${vet.exp} years</strong></p>
                            <p class="text-[10px] text-emerald-400">Successful case files: <strong>${vet.treatments}+</strong></p>
                        </div>
                        <button class="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-[10px] px-2 py-1 rounded transition-all" onclick="initiateDirectVetChat(event, '${vet.id}', '${vet.name}')">💬 Message</button>
                    </div>
                    <div class="border-t border-slate-900 pt-1 text-[10px] text-slate-500 italic">
                        Latest Review summary: "${vet.reviews[0]}"
                    </div>
                </div>
            `;
        });

        // Check if a notepad page transmission workflow is primed
        let shareButtonHTML = "";
        if (state.pendingShareNote) {
            shareButtonHTML = `
                <button onclick="executeNoteTransmission()" class="w-full bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs hover:bg-amber-300 transition-all">
                    📤 Send Digital Note Asset to This Clinic
                </button>
            `;
        } else {
            shareButtonHTML = `
                <button onclick="triggerAutoAllocationBooking('${activeClinic.id}')" class="w-full bg-teal-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs hover:bg-teal-400 transition-all">
                    📅 Book Appointment (Auto-Allocate Workload Vet)
                </button>
            `;
        }

        focusPanel.innerHTML = `
            <div class="space-y-2 border-b border-slate-800 pb-4">
                <span class="text-2xl">🏥</span>
                <h2 class="text-base font-black text-white">${activeClinic.name}</h2>
                <p class="text-xs text-slate-400">${activeClinic.address}</p>
                <p class="text-xs text-slate-300">Direct Contact Hub: ${activeClinic.contact}</p>
            </div>
            
            <div class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">On-Site Physicians & Surgeons</h3>
                <div class="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    ${vetListHTML}
                </div>
            </div>

            <div class="pt-2">
                ${shareButtonHTML}
            </div>
        `;
    }
}

// VIEW 3: PET STORES SUITE RENDERING
function renderPetStoresTab() {
    const grid = document.getElementById("stores-grid");
    grid.innerHTML = "";

    PET_STORES.forEach(store => {
        let stockHTML = "";
        store.stock.forEach(item => {
            stockHTML += `<span class="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] px-2 py-0.5 rounded">${item}</span>`;
        });

        const card = document.createElement("div");
        card.className = "bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm";
        card.innerHTML = `
            <div class="space-y-1">
                <span class="text-xl">🛒</span>
                <h3 class="text-sm font-bold text-white">${store.name}</h3>
                <p class="text-xs text-slate-400">${store.address}</p>
                <p class="text-[11px] text-slate-500 pt-1">🕒 Operational Windows: ${store.hours}</p>
            </div>
            <div class="space-y-2">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Stock Elements</p>
                <div class="flex flex-wrap gap-1.5">
                    ${stockHTML}
                </div>
            </div>
            <button onclick="alert('Simulation: Curbside click-to-collect requisition orders successfully mapped onto store networks.')" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-semibold transition-all">
                Pre-Order Retail Requisition
            </button>
        `;
        grid.appendChild(card);
    });
}

// VIEW 4: APPOINTMENTS CENTER MODULE RENDERING
function renderAppointmentsTab() {
    // Generate Calendar dates blocks mapping loop
    const daysGrid = document.getElementById("calendar-days-grid");
    daysGrid.innerHTML = "";
    
    // Render 14 working operational calendar day capsules mock sequence
    for (let i = 1; i <= 14; i++) {
        const dayNum = i + 14; // Let's simulate mid-month dates grid
        const isWeekend = i % 7 === 5 || i % 7 === 6; // Mock weekend bounds
        const isSelected = state.selectedScheduleDate === dayNum;

        const btn = document.createElement("button");
        btn.disabled = isWeekend;
        btn.className = `p-2 rounded text-center transition-all flex flex-col items-center font-bold ${isWeekend ? 'bg-slate-900/20 text-slate-700 cursor-not-allowed' : isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`;
        btn.innerHTML = `
            <span>${dayNum}</span>
            <span class="text-[8px] opacity-70">${isWeekend ? 'Closed' : 'Open'}</span>
        `;
        
        if (!isWeekend) {
            btn.onclick = () => {
                state.selectedScheduleDate = dayNum;
                state.selectedScheduleTime = null; // reset hours choice
                renderAppointmentsTab();
            };
        }
        daysGrid.appendChild(btn);
    }

    // Render Time slots capsules array matching choice
    const hoursContainer = document.getElementById("time-slots-container");
    hoursContainer.innerHTML = "";

    if (state.selectedScheduleDate) {
        const slots = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"];
        slots.forEach(time => {
            const isSelectedTime = state.selectedScheduleTime === time;
            const item = document.createElement("button");
            item.className = `p-1.5 text-[10px] rounded-lg border font-bold text-center transition-all ${isSelectedTime ? 'bg-teal-500 border-teal-500 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`;
            item.innerText = time;
            item.onclick = () => {
                state.selectedScheduleTime = time;
                renderAppointmentsTab();
            };
            hoursContainer.appendChild(item);
        });
    } else {
        hoursContainer.innerHTML = `<p class="text-[11px] text-slate-500 col-span-3">Select an open calendar day cell tracking metric.</p>`;
    }

    // Validate Scheduler Submission eligibility checks
    const activeClinic = INITIAL_CLINICS.find(c => c.id === state.selectedClinicId);
    const bookBtn = document.getElementById("submit-booking-btn");
    const metaBlock = document.getElementById("scheduler-clinic-meta");

    if (activeClinic) {
        metaBlock.innerHTML = `📍 Target Clinic: <strong>${activeClinic.name}</strong>`;
        if (state.selectedScheduleDate && state.selectedScheduleTime) {
            bookBtn.disabled = false;
            bookBtn.className = "w-full bg-teal-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs tracking-wider transition-all hover:bg-teal-400 cursor-pointer";
        } else {
            bookBtn.disabled = true;
            bookBtn.className = "w-full bg-slate-800 text-slate-500 font-bold py-2.5 rounded-lg text-xs tracking-wider cursor-not-allowed";
        }
    } else {
        metaBlock.innerHTML = `No clinic selected. Head to <strong>Vet Locate & Map</strong> to choose a facility first.`;
        bookBtn.disabled = true;
        bookBtn.className = "w-full bg-slate-800 text-slate-500 font-bold py-2.5 rounded-lg text-xs tracking-wider cursor-not-allowed";
    }

    // Render Lists columns (Upcoming vs Past)
    renderSchedulesLists();
}

function renderSchedulesLists() {
    const upcomingBox = document.getElementById("upcoming-appointments-list");
    const pastBox = document.getElementById("past-appointments-list");
    upcomingBox.innerHTML = "";
    pastBox.innerHTML = "";

    // Render Upcoming List
    const upcomingSchedules = state.appointments.filter(a => a.status === "scheduled");
    if (upcomingSchedules.length === 0) {
        upcomingBox.innerHTML = `<p class="text-xs text-slate-500 text-center py-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">No upcoming clinic appointments logs active.</p>`;
    } else {
        upcomingSchedules.forEach(app => {
            const div = document.createElement("div");
            div.className = "bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3";
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="text-xs font-bold text-white">${app.clinicName}</h4>
                        <p class="text-[10px] text-slate-400">Assigned Physician: <strong class="text-teal-400">${app.assignedVet}</strong></p>
                        <p class="text-[10px] text-slate-400">Patient Focus: <strong class="text-slate-300">${app.petName}</strong></p>
                    </div>
                    <span class="bg-teal-500/10 text-teal-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">${app.time}</span>
                </div>
                <p class="text-xs text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800/60">Reasoning: ${app.reason}</p>
                
                <!-- Custom Inline Safe Iframe-Proof Cancellation Panel -->
                <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                    <span class="text-slate-500 text-[10px]">📅 Date Node: July ${app.date}</span>
                    <div id="cancel-zone-${app.id}">
                        <button onclick="triggerInlineCancelClick('${app.id}')" class="text-red-400 hover:underline text-[11px]">Cancel Booking</button>
                    </div>
                    <div id="cancel-confirm-${app.id}" class="hidden flex items-center space-x-2 bg-slate-950 p-1 rounded border border-red-500/20">
                        <span class="text-red-300 text-[10px]">Cancel?</span>
                        <button onclick="executeAppointmentCancellation('${app.id}')" class="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded">Yes</button>
                        <button onclick="resetInlineCancelClick('${app.id}')" class="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.5 rounded">Keep</button>
                    </div>
                </div>
            `;
            upcomingBox.appendChild(div);
        });
    }

    // Render Past Records Mock Base context
    const historicalMockData = [
        { clinic: "VetCare Central Hospital", time: "July 02, 2026", vet: "Dr. Sarah Chen, DVM", pet: "Max", reason: "Standard core annual booster shots vaccines check-in.", result: "Healthy profile sequence logged perfectly." }
    ];
    
    historicalMockData.forEach(p => {
        const block = document.createElement("div");
        block.className = "bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl text-xs space-y-2 opacity-70";
        block.innerHTML = `
            <div class="flex justify-between text-slate-400 font-bold">
                <span>🏥 ${p.clinic}</span>
                <span>${p.time}</span>
            </div>
            <p class="text-slate-300">Attending: <strong>${p.vet}</strong> • Patient: <strong>${p.pet}</strong></p>
            <p class="text-slate-400 italic">Clinical Assessment Summary: ${p.result}</p>
        `;
        pastBox.appendChild(block);
    });
}

// VIEW 5: VETERINARIAN PORTAL DESK RENDERING
function renderVetPortalTab() {
    const listContainer = document.getElementById("vet-assigned-list");
    listContainer.innerHTML = "";

    // Find appointments belonging to the clinician's matching clinic
    const activeVetClinic = INITIAL_CLINICS.find(c => c.name.includes(state.userSession.workplace) || c.vets.some(v => v.name.includes(state.userSession.username)));
    const targetClinicName = activeVetClinic ? activeVetClinic.name : "VetCare Central Hospital & 24/7 ER";

    const filterApps = state.appointments.filter(a => a.status === "scheduled");

    if (filterApps.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-slate-500 p-4 text-center">No active fair-allocation patient queues routed currently.</p>`;
        return;
    }

    filterApps.forEach(app => {
        const item = document.createElement("div");
        item.className = "bg-slate-950 p-3 rounded-xl border border-slate-800 text-left hover:border-emerald-500/40 transition-all cursor-pointer";
        item.onclick = () => launchVetPatientFocusDesk(app);
        item.innerHTML = `
            <div class="flex justify-between items-center">
                <h4 class="text-xs font-bold text-white">Patient: ${app.petName}</h4>
                <span class="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">${app.time}</span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Stated Reason: ${app.reason}</p>
        `;
        listContainer.appendChild(item);
    });
}

function launchVetPatientFocusDesk(app) {
    const focusBox = document.getElementById("vet-patient-focus");
    
    // Check for shared notepad pages matching this pet's owner records
    let sharedNotesHTML = "";
    const primaryPet = state.pets.find(p => p.name === app.petName);
    
    if (primaryPet && primaryPet.notes.length > 0) {
        primaryPet.notes.forEach(note => {
            sharedNotesHTML += `
                <div class="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs space-y-1">
                    <p class="font-bold text-amber-300">📋 Shared Title: ${note.title}</p>
                    <p class="text-slate-300 leading-relaxed">${note.body}</p>
                </div>
            `;
        });
    } else {
        sharedNotesHTML = `<p class="text-[11px] text-slate-500 italic">No historical notepad page assets explicitly routed to this terminal yet.</p>`;
    }

    focusBox.innerHTML = `
        <div class="space-y-4 animate-fade-in">
            <div class="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                    <h3 class="text-sm font-bold text-white">Reviewing Patient: ${app.petName}</h3>
                    <p class="text-[10px] text-slate-400">Assigned Seat: ${app.assignedVet}</p>
                </div>
                <span class="text-xs text-slate-400">Date Log: July ${app.date}</span>
            </div>

            <div class="space-y-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Shared Parent Notepad Pages</h4>
                <div class="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                    ${sharedNotesHTML}
                </div>
            </div>

            <!-- Digital Prescription Generation System Form Interface Layout component -->
            <div class="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                <h4 class="text-xs font-bold text-emerald-400 flex items-center"><span>🩺</span> <span class="ml-1">Digital Prescription & Instructions Matrix</span></h4>
                <input type="text" id="presc-med" placeholder="Medication Formula (e.g. Amoxicillin)" class="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded">
                <textarea id="presc-inst" placeholder="Dosage tracking directives and specific guidance instructions..." class="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded h-16 outline-none resize-none"></textarea>
                <button onclick="executeClinicalSignOff('${app.id}')" class="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded text-xs transition-all hover:bg-emerald-400">
                    Sign, Close Consultation & Append Timeline Record
                </button>
            </div>
        </div>
    `;
}

// FLOATING DRAWER CONVERSATIONS CHANNEL RENDERING
function renderChatWidget() {
    const channelsContainer = document.getElementById("chat-channels-bar");
    channelsContainer.innerHTML = "";

    // Establish dynamic channels listing configuration array
    const channels = [
        { id: "dr-buddy", name: "🤖 Dr. Buddy AI" }
    ];

    // Append custom clinician channels if appointments exist to populate contact cards
    state.appointments.forEach(a => {
        if (!channels.some(c => c.id === a.clinicId)) {
            channels.push({ id: a.clinicId, name: `👨‍⚕️ ${a.assignedVet}` });
        }
    });

    channels.forEach(ch => {
        const isActive = ch.id === state.activeChatId;
        const btn = document.createElement("button");
        btn.className = `p-2 text-[10px] font-bold rounded-lg text-left truncate transition-all ${isActive ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900'}`;
        btn.innerText = ch.name;
        btn.onclick = () => {
            state.activeChatId = ch.id;
            renderChatWidget();
        };
        channelsContainer.appendChild(btn);
    });

    // Output message bubble logs stream filters
    const msgBox = document.getElementById("chat-messages-box");
    msgBox.innerHTML = "";

    const filteredMessages = state.chatMessages.filter(m => m.receiverId === state.activeChatId || (state.activeChatId === "dr-buddy" && m.senderId === "dr-buddy") || (m.senderId === state.activeChatId));
    
    filteredMessages.forEach(msg => {
        const isMe = msg.senderId === "me";
        const div = document.createElement("div");
        div.className = `p-2.5 rounded-xl max-w-[85%] text-xs space-y-1 transform animate-fade-in ${isMe ? 'bg-teal-600 text-white ml-auto rounded-tr-none' : 'bg-slate-950 text-slate-200 mr-auto rounded-tl-none'}`;
        
        let imgHTML = msg.imageUrl ? `<img src="${msg.imageUrl}" class="w-full max-w-[180px] rounded-lg mb-1 border border-slate-800 object-cover">` : '';
        div.innerHTML = `
            ${imgHTML}
            <p class="leading-relaxed">${msg.text}</p>
        `;
        msgBox.appendChild(div);
    });
    msgBox.scrollTop = msgBox.scrollHeight;
}

// --- CONTROLLERS, SUBMISSIONS, ACTIONS & HANDLERS ---
function setupEventListeners() {
    // Auth Role Switching buttons hooks layout
    document.getElementById("role-owner-btn").onclick = () => toggleAuthRole("owner");
    document.getElementById("role-vet-btn").onclick = () => toggleAuthRole("vet");
    document.getElementById("toggle-form-mode").onclick = toggleAuthFormMode;

    // Core Authorization Form handling submit sequence intercepts
    document.getElementById("auth-form").onsubmit = executeAuthenticationSubmit;
    document.getElementById("sim-approve-btn").onclick = executeSimulatedVetApproval;

    // Navigation Tab triggers routing mapping loops
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.onclick = () => switchTab(btn.getAttribute("data-tab"));
    });

    document.getElementById("logout-btn").onclick = () => {
        state.userSession = null;
        localStorage.removeItem("vetcare_session");
        routeViewDisplay();
    };

    // View 1 Pet Dashboard Registrar Form submission engine bindings
    document.getElementById("pet-register-form").onsubmit = (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("pet-photo-upload");
        const file = fileInput.files[0];
        
        const executeAdd = (photoUrl) => {
            const newPet = {
                id: "pet-" + Date.now(),
                name: document.getElementById("pet-name").value,
                species: document.getElementById("pet-species").value,
                breed: document.getElementById("pet-breed").value,
                age: parseInt(document.getElementById("pet-age").value),
                weight: parseInt(document.getElementById("pet-weight").value),
                photo: photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200",
                notes: []
            };
            state.pets.push(newPet);
            state.activePetId = newPet.id;
            saveStateToStorage();
            renderMyPetsTab();
            document.getElementById("pet-register-form").reset();
        };

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => executeAdd(reader.result);
            reader.readAsDataURL(file);
        } else {
            executeAdd(null);
        }
    };

    // Notepad Actions Controllers Setup functions triggers
    document.getElementById("new-note-btn").onclick = () => {
        const activePet = state.pets.find(p => p.id === state.activePetId);
        if (!activePet) return;
        const newNote = { id: "note-" + Date.now(), title: "New Note Page Entry", body: "" };
        activePet.notes.push(newNote);
        state.activeNoteId = newNote.id;
        renderMyPetsTab();
    };

    document.getElementById("note-save-btn").onclick = () => {
        const activePet = state.pets.find(p => p.id === state.activePetId);
        if (!activePet) return;
        const activeNote = activePet.notes.find(n => n.id === state.activeNoteId);
        if (!activeNote) return;

        activeNote.title = document.getElementById("note-title").value || "Untitled Entry Page";
        activeNote.body = document.getElementById("note-body").value;
        saveStateToStorage();
        renderMyPetsTab();
        alert("Notepad entry saved securely into browser local memory context.");
    };

    // Safe Inline notepad page actions confirmation toggle nodes functions hooks
    document.getElementById("note-delete-trigger").onclick = () => {
        document.getElementById("note-delete-trigger").classList.add("hidden");
        document.getElementById("note-delete-confirm").classList.remove("hidden");
    };
    document.getElementById("note-delete-no").onclick = () => {
        document.getElementById("note-delete-trigger").classList.remove("hidden");
        document.getElementById("note-delete-confirm").classList.add("hidden");
    };
    document.getElementById("note-delete-yes").onclick = () => {
        const activePet = state.pets.find(p => p.id === state.activePetId);
        if (activePet) {
            activePet.notes = activePet.notes.filter(n => n.id !== state.activeNoteId);
            state.activeNoteId = activePet.notes.length > 0 ? activePet.notes[0].id : null;
            saveStateToStorage();
            renderMyPetsTab();
        }
        document.getElementById("note-delete-trigger").classList.remove("hidden");
        document.getElementById("note-delete-confirm").classList.add("hidden");
    };

    // Map-Based Note Sharing Mode Initialization Switcher Engine Call
    document.getElementById("note-share-trigger").onclick = () => {
        const activePet = state.pets.find(p => p.id === state.activePetId);
        if (!activePet) return;
        const activeNote = activePet.notes.find(n => n.id === state.activeNoteId);
        if (!activeNote) return;

        state.pendingShareNote = { petId: activePet.id, noteId: activeNote.id, noteTitle: activeNote.title };
        document.getElementById("share-banner").classList.remove("hidden");
        switchTab("vet-finder");
    };

    document.getElementById("cancel-share-btn").onclick = () => {
        state.pendingShareNote = null;
        document.getElementById("share-banner").classList.add("hidden");
        if (document.getElementById("view-vet-finder").classList.contains("hidden") === false) {
            renderVetFinderTab();
        }
    };

    // Primary Appointment Requisition Scheduler Form Button commit handler pipeline logic
    document.getElementById("submit-booking-btn").onclick = () => {
        const clinic = INITIAL_CLINICS.find(c => c.id === state.selectedClinicId);
        const activePet = state.pets.find(p => p.id === state.activePetId);
        if (!clinic || !activePet) return;

        // FAIR-ALLOCATION DESIGN ENGINE: Identify practitioner working on-site with matching lowest overall workload schedules metrics
        let assignedPhysician = clinic.vets[0].name;
        let lowestCount = Infinity;

        clinic.vets.forEach(v => {
            const currentWorkloadCount = state.appointments.filter(a => a.assignedVet === v.name && a.status === "scheduled").length;
            if (currentWorkloadCount < lowestCount) {
                lowestCount = currentWorkloadCount;
                assignedPhysician = v.name;
            }
        });

        const newAppointment = {
            id: "app-" + Date.now(),
            clinicId: clinic.id,
            clinicName: clinic.name,
            date: state.selectedScheduleDate,
            time: state.selectedScheduleTime,
            reason: document.getElementById("appointment-reason").value || "General routine check-up.",
            status: "scheduled",
            assignedVet: assignedPhysician,
            petName: activePet.name
        };

        state.appointments.push(newAppointment);
        saveStateToStorage();
        
        // Reset inputs states contexts
        state.selectedScheduleDate = null;
        state.selectedScheduleTime = null;
        document.getElementById("appointment-reason").value = "";
        
        renderAppointmentsTab();
        alert(`Booking Confirmed! The fair-allocation mechanism successfully routed this slot to ${assignedPhysician} based on system balancing metrics load parameters.`);
    };

    // Appointment upcoming vs past sub-tab toggles handlers engine
    document.getElementById("subtab-upcoming").onclick = () => {
        document.getElementById("subtab-upcoming").className = "pb-3 text-sm font-bold border-b-2 border-teal-400 text-white";
        document.getElementById("subtab-past").className = "pb-3 text-sm font-semibold text-slate-400 hover:text-white border-b-2 border-transparent";
        document.getElementById("upcoming-appointments-list").classList.remove("hidden");
        document.getElementById("past-appointments-list").classList.add("hidden");
    };
    document.getElementById("subtab-past").onclick = () => {
        document.getElementById("subtab-past").className = "pb-3 text-sm font-bold border-b-2 border-teal-400 text-white";
        document.getElementById("subtab-upcoming").className = "pb-3 text-sm font-semibold text-slate-400 hover:text-white border-b-2 border-transparent";
        document.getElementById("past-appointments-list").classList.remove("hidden");
        document.getElementById("upcoming-appointments-list").classList.add("hidden");
    };

    // Chat Drawer Window Expand launcher drawer widget visibility controls
    document.getElementById("chat-launcher-btn").onclick = () => {
        document.getElementById("chat-drawer-window").classList.toggle("hidden");
        renderChatWidget();
    };
    document.getElementById("close-chat-btn").onclick = () => {
        document.getElementById("chat-drawer-window").classList.add("hidden");
    };

    // Chat Attachment Image Input handling logic base encoder mapping pipeline
    document.getElementById("chat-image-attach").onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Post simulated image payload message directly in sandbox
                state.chatMessages.push({
                    id: "m-img-" + Date.now(),
                    senderId: "me",
                    receiverId: state.activeChatId,
                    text: "📷 Diagnostic photo logs uploaded to terminal.",
                    imageUrl: reader.result,
                    timestamp: "Now"
                });
                renderChatWidget();
            };
            reader.readAsDataURL(file);
        }
    };

    // Chat Text Form handling submission events pipeline matrix intercepts
    document.getElementById("chat-input-form").onsubmit = (e) => {
        e.preventDefault();
        const f = document.getElementById("chat-text-field");
        const userText = f.value.trim();
        if (!userText) return;

        state.chatMessages.push({
            id: "m-user-" + Date.now(),
            senderId: "me",
            receiverId: state.activeChatId,
            text: userText,
            timestamp: "Now"
        });
        f.value = "";
        renderChatWidget();

        // If target channel is AI Dr Buddy Advisor system -> generate an immediate nursing summary response call setup
        if (state.activeChatId === "dr-buddy") {
            setTimeout(() => {
                state.chatMessages.push({
                    id: "m-ai-" + Date.now(),
                    senderId: "dr-buddy",
                    receiverId: "all",
                    text: `[Dr. Buddy AI Response Simulation Mode]: Parsed input parameter log entry "${userText}". Supportive nursing assessment implies monitoring hydration metrics levels. Prepare records elements to present directly to your on-site fair-allocation clinician matching blocks.`,
                    timestamp: "Now"
                });
                renderChatWidget();
            }, 1000);
        }
    };
}

// Onboarding Gateway State Toggles Adjusters Management Functions UI Modules
function toggleAuthRole(role) {
    const ownerBtn = document.getElementById("role-owner-btn");
    const vetBtn = document.getElementById("role-vet-btn");
    const vetFields = document.getElementById("vet-fields");

    if (role === "owner") {
        ownerBtn.className = "py-2.5 rounded-lg text-sm font-bold transition-all bg-teal-500 text-slate-950";
        vetBtn.className = "py-2.5 rounded-lg text-sm font-bold transition-all text-slate-400 hover:text-white";
        vetFields.classList.add("hidden");
    } else {
        vetBtn.className = "py-2.5 rounded-lg text-sm font-bold transition-all bg-emerald-500 text-slate-950";
        ownerBtn.className = "py-2.5 rounded-lg text-sm font-bold transition-all text-slate-400 hover:text-white";
        vetFields.classList.remove("hidden");
    }
}

function toggleAuthFormMode() {
    state.isLoginMode = !state.isLoginMode;
    renderOnboardingForm();
}

function renderOnboardingForm() {
    const title = document.getElementById("form-title");
    const toggleBtn = document.getElementById("toggle-form-mode");
    const submitBtn = document.getElementById("auth-submit-btn");
    const ageBlock = document.getElementById("age-input-block");
    const outboxLog = document.getElementById("admin-outbox");

    if (state.isLoginMode) {
        title.innerText = "Access Workspace (Log In)";
        toggleBtn.innerText = "Need to make an account?";
        submitBtn.innerText = "Authorize & Synchronize Session";
        ageBlock.classList.add("hidden");
        outboxLog.classList.add("hidden");
    } else {
        title.innerText = "Create Account (Sign Up)";
        toggleBtn.innerText = "Already have an account?";
        submitBtn.innerText = "Register & Initialize Portal";
        // If vet selected, ensure outbox panel displays correctly if fields visible
        const isVet = !document.getElementById("vet-fields").classList.contains("hidden");
        if (isVet) outboxLog.classList.remove("hidden");
    }
}

function executeAuthenticationSubmit(e) {
    e.preventDefault();
    const username = document.getElementById("auth-username").value;
    const email = document.getElementById("auth-email").value;
    const age = document.getElementById("auth-age").value || "30";
    const isVetMode = !document.getElementById("vet-fields").classList.contains("hidden");

    if (isVetMode && !state.isLoginMode) {
        // Sign-up process requires administrator checklist approval action step
        document.getElementById("admin-outbox").classList.remove("hidden");
        alert("Licensure alert message constructed for verification simulation outbox. Click the verification button to confirm.");
        return;
    }

    // Process normal entry log operations parameters mapping directly
    state.userSession = {
        role: isVetMode ? "vet" : "owner",
        username: username,
        email: email,
        age: age,
        workplace: isVetMode ? document.getElementById("auth-workplace").value : null,
        verified: isVetMode ? true : false
    };

    saveStateToStorage();
    routeViewDisplay();
    renderAllViews();
}

function executeSimulatedVetApproval() {
    const username = document.getElementById("auth-username").value;
    const email = document.getElementById("auth-email").value;
    const age = document.getElementById("auth-age").value || "35";
    const workplace = document.getElementById("auth-workplace").value || "VetCare Central Hospital";

    state.userSession = {
        role: "vet",
        username: username || "Dr. Sarah Chen, DVM",
        email: email,
        age: age,
        workplace: workplace,
        verified: true
    };

    saveStateToStorage();
    routeViewDisplay();
    renderAllViews();
    switchTab("vet-portal");
}

// Side-Bar / List Inline Note Removal prompt helpers
function triggerInlineNoteDelete(event, noteId) {
    event.stopPropagation();
    const activePet = state.pets.find(p => p.id === state.activePetId);
    if (activePet) {
        activePet.notes = activePet.notes.filter(n => n.id !== noteId);
        state.activeNoteId = activePet.notes.length > 0 ? activePet.notes[0].id : null;
        saveStateToStorage();
        renderMyPetsTab();
    }
}

// Map Routing Execution Note Transit Actions Functions Engine Core Calls
function executeNoteTransmission() {
    if (!state.pendingShareNote) return;
    const activeClinic = INITIAL_CLINICS.find(c => c.id === state.selectedClinicId);
    alert(`Transmission Complete! The notepad page asset "${state.pendingShareNote.noteTitle}" was packaged and safely attached to ${activeClinic.name}'s practitioner reception network queue.`);
    
    // Clear transmission banner status parameters bounds
    state.pendingShareNote = null;
    document.getElementById("share-banner").classList.add("hidden");
    renderVetFinderTab();
}

// Auto Routing Trigger from Map Module directly into Appointment forms slots parameters
function triggerAutoAllocationBooking(clinicId) {
    state.selectedClinicId = clinicId;
    switchTab("appointments");
}

// Appointment Inline Cancel Prompt controls modules functions
function triggerInlineCancelClick(id) {
    document.getElementById(`cancel-zone-${id}`).classList.add("hidden");
    document.getElementById(`cancel-confirm-${id}`).classList.remove("hidden");
}
function resetInlineCancelClick(id) {
    document.getElementById(`cancel-zone-${id}`).classList.remove("hidden");
    document.getElementById(`cancel-confirm-${id}`).classList.add("hidden");
}
function executeAppointmentCancellation(id) {
    state.appointments = state.appointments.filter(a => a.id !== id);
    saveStateToStorage();
    renderAppointmentsTab();
}

// Vet Dashboard Action Processing Sign-Off & Timeline checklist commits pipeline
function executeClinicalSignOff(appId) {
    const med = document.getElementById("presc-med").value;
    const inst = document.getElementById("presc-inst").value;
    if (!med) { alert("Input validation placeholder alert: Specify at least one medication formula asset."); return; }

    state.appointments = state.appointments.map(a => {
        if (a.id === appId) {
            return { ...a, status: "completed", reason: `Closed with instructions: Prescribed ${med}. ${inst}` };
        }
        return a;
    });

    saveStateToStorage();
    renderVetPortalTab();
    document.getElementById("vet-patient-focus").innerHTML = `<p class="text-xs text-emerald-400 font-bold p-6 bg-emerald-950/20 rounded-xl text-center border border-emerald-500/20">✓ Consultation closed out. Digital prescription bound to client timeline logs context.</p>`;
}

// Direct floating messenger routing interface shortcut helper trigger logic functions block bounds
function initiateDirectVetChat(event, vetId, vetName) {
    event.stopPropagation();
    state.activeChatId = vetId;
    
    // Check if channel introduction greeting bubble logs already configured
    if (!state.chatMessages.some(m => m.senderId === vetId)) {
        state.chatMessages.push({
            id: "m-greet-" + Date.now(),
            senderId: vetId,
            receiverId: "me",
            text: `Hello! This is ${vetName}. I am available to consult or review any digital notepad entries you transmit directly through your dashboard.`,
            timestamp: "Now"
        });
    }

    document.getElementById("chat-drawer-window").classList.remove("hidden");
    renderChatWidget();
}

// --- RUN ENGINE ON BOOT ---
window.onload = initializeApp;
