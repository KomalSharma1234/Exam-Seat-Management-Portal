let typedKeys = '';
const secretWord = 'antigravity';

window.addEventListener('keydown', (e) => {
    typedKeys += e.key.toLowerCase();
    if (typedKeys.length > secretWord.length) {
        typedKeys = typedKeys.slice(-secretWord.length);
    }

    if (typedKeys === secretWord) {
        document.body.classList.toggle('mode');
        alert(" You found the hidden command!");
        typedKeys = '';
    }
});
window.printSeatSlip = function (name, roll, block, row, seat) {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    printWindow.document.writeln(`
        <html>
        <head>
            <title>Seat Slip - ${roll}</title>
            <style>
                body { font-family: monospace; padding: 20px; text-align: center; margin: 20px; }
                .slip { border: 2px dashed #000; padding: 20px; }
                h2 { border-bottom: 1px solid #000; padding-bottom: 10px; margin-top: 0; }
                p { font-size: 16px; margin: 5px 0; text-align: left; }
                .footer { font-size: 12px; margin-top: 20px; color: #555; text-align: center; }
            </style>
        </head>
        <body>
            <div class="slip">
                <h2>CHITKARA UNIVERSITY</h2>
                <h3>EXAM SEAT SLIP</h3>
                <div style="margin: 20px 0;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Roll No:</strong> ${roll}</p>
                    <p><strong>Block:</strong> ${block}</p>
                    <p><strong>Row:</strong> ${row}</p>
                    <p style="font-size: 20px; margin-top:15px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                        <strong>Seat:</strong> ${seat}
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// --- CAMPUS MAP LOGIC ---
let campusMap = null;
let currentMarker = null;
let routingControl = null;

window.showOnMap = function (blockName, coords) {
    const modal = document.getElementById('map-modal');
    if (!modal) return;

    modal.style.display = 'block';

    // Initialize map if not exists
    if (!campusMap) {
        campusMap = L.map('map').setView([30.5161, 76.6592], 17);
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        });
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
        });

        osm.addTo(campusMap);
        L.control.layers({ "Street": osm, "Satellite": satellite }).addTo(campusMap);
    }

    // CRITICAL: Refresh map size after showing modal
    setTimeout(() => {
        campusMap.invalidateSize();

        // Clear previous markers/routes
        if (currentMarker) campusMap.removeLayer(currentMarker);
        if (routingControl) campusMap.removeControl(routingControl);

        // Show Destination Marker
        currentMarker = L.marker(coords).addTo(campusMap)
            .bindPopup(`<b>${blockName} Block</b><br>Exam Center Location`)
            .openPopup();

        // 🚀 GET DIRECTIONS FROM USER LOCATION
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const userCoords = [pos.coords.latitude, pos.coords.longitude];

                routingControl = L.Routing.control({
                    waypoints: [
                        L.latLng(userCoords[0], userCoords[1]),
                        L.latLng(coords[0], coords[1])
                    ],
                    lineOptions: {
                        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }]
                    },
                    show: false, // Keep it clean by hiding text instructions
                    addWaypoints: false,
                    routeWhileDragging: false
                }).addTo(campusMap);

                // Zoom to show the whole path
                campusMap.fitBounds([userCoords, coords]);
            }, (err) => {
                console.warn("Location permission denied. Showing static marker.");
                campusMap.setView(coords, 18);
            });
        } else {
            campusMap.setView(coords, 18);
        }
    }, 100);
};

window.printTeacherSlip = function (teacherId, blockName, examDate, examTime, examName) {
    const printWindow = window.open('', '_blank', 'width=400,height=550');
    printWindow.document.writeln(`
        <html>
        <head>
            <title>Duty Slip - ${teacherId}</title>
            <style>
                body { font-family: monospace; padding: 20px; text-align: center; margin: 20px; }
                .slip { border: 2px dashed #000; padding: 20px; }
                h2 { border-bottom: 1px solid #000; padding-bottom: 10px; margin-top: 0; }
                p { font-size: 16px; margin: 5px 0; text-align: left; }
                .footer { font-size: 12px; margin-top: 20px; color: #555; text-align: center; }
            </style>
        </head>
        <body>
            <div class="slip">
                <h2>CHITKARA UNIVERSITY</h2>
                <h3>TEACHER DUTY SLIP</h3>
                <div style="margin: 20px 0;">
                    <p><strong>Teacher ID:</strong> ${teacherId}</p>
                    <p><strong>Subject Name:</strong> ${examName}</p>
                    <p><strong>Block Name:</strong> ${blockName}</p>
                    <p><strong>Date:</strong> ${examDate}</p>
                    <p style="font-size: 20px; margin-top:15px; text-align: center; border-top: 1px solid #ae2020ff; padding-top: 10px;">
                        <strong>Time:</strong> ${examTime}
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
};

document.addEventListener("DOMContentLoaded", () => {
    const btnSearchRoll = document.getElementById('btn-search-roll');
    const rollSearchResults = document.getElementById('roll-search-results');
    const rollQuery = document.getElementById('search-query-roll');

    if (btnSearchRoll && rollSearchResults && rollQuery) {

        const executeSearch = async () => {
            const query = rollQuery.value.trim();
            if (!query) return;

            btnSearchRoll.textContent = 'Searching...';
            btnSearchRoll.disabled = true;

            try {
                const res = await fetch(`/api/search_roll`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roll_no: query })
                });
                const json = await res.json();

                rollSearchResults.innerHTML = '';

                if (json.success && json.data) {
                    const student = json.data;

                    // Show Result with Map Option
                    rollSearchResults.innerHTML = `
                        <div class="alert success" style="background: rgba(110, 231, 183, 0.1); border: 1px solid var(--accent); padding: 1.5rem; text-align: center;">
                            <h3 style="color: var(--accent); margin-bottom: 0.5rem;">🎉 Seat Found!</h3>
                            <p><strong>Block:</strong> ${student.block} | <strong>Row:</strong> ${student.row} | <strong>Seat:</strong> ${student.seat}</p>
                            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                                <button onclick="printSeatSlip('${student.name}', '${student.roll_no}', '${student.block}', '${student.row}', '${student.seat}')" class="btn btn-sm">🖨️ Print Slip</button>
                                <button onclick="showOnMap('${student.block}', [${student.coords}])" class="btn btn-sm" style="background:var(--primary);">📍 View on Map</button>
                            </div>
                        </div>
                    `;

                    // Also auto-show the slip for convenience
                    printSeatSlip(student.name, student.roll_no, student.block, student.row, student.seat);

                } else {
                    rollSearchResults.innerHTML = `<p class="alert alert-error" style="background: rgba(53, 234, 21, 0.2); backdrop-filter: blur(10px);">${json.message || 'No seat found.'}</p>`;
                }
            } catch (err) {
                rollSearchResults.innerHTML = '<p class="alert alert-error">Failed to connect to search server.</p>';
            } finally {
                btnSearchRoll.textContent = 'Find Seat';
                btnSearchRoll.disabled = false;
            }
        };

        btnSearchRoll.addEventListener('click', executeSearch);

        // Allow pressing Enter in the input box
        rollQuery.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch();
            }
        });
    }

    const btnGenerateTeacherSlip = document.getElementById('btn-generate-teacher');
    if (btnGenerateTeacherSlip) {
        btnGenerateTeacherSlip.addEventListener('click', (e) => {
            e.preventDefault();
            const teacherName = document.getElementById('t-name').value.trim();
            const blockName = document.getElementById('t-block').value.trim();
            const examDate = document.getElementById('t-date').value.trim();
            const examTime = document.getElementById('t-time').value.trim();
            const examName = document.getElementById('t-exam').value.trim();

            if (!teacherName || !blockName || !examDate || !examTime || !examName) {
                alert("Please fill in all details to generate the Teacher Duty Slip.");
                return;
            }

            printTeacherSlip(teacherName, blockName, examDate, examTime, examName);
        });
    }

    const btnSearchTeacher = document.getElementById('btn-search-teacher');
    const teacherSearchQuery = document.getElementById('teacher-search-query');
    const teacherSearchResults = document.getElementById('teacher-search-results');

    if (btnSearchTeacher && teacherSearchQuery) {
        btnSearchTeacher.addEventListener('click', async () => {
            const query = teacherSearchQuery.value.trim();
            if (!query) {
                alert("Please enter a Teacher Name or ID to search.");
                return;
            }

            btnSearchTeacher.textContent = 'Searching...';
            btnSearchTeacher.disabled = true;

            try {
                const res = await fetch('/api/search_teacher', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: query })
                });
                const json = await res.json();

                if (json.success && json.data) {
                    const m = json.data;

                    // Auto-print slip
                    printTeacherSlip(m.id, m.block, m.date, m.time, m.exam);

                    // Show result with Map Option
                    if (teacherSearchResults) {
                        teacherSearchResults.innerHTML = `
                            <div class="alert success" style="background: rgba(110, 231, 183, 0.1); border: 1px solid var(--accent); padding: 1.5rem; text-align: center; margin-top: 1rem;">
                                <h3 style="color: var(--accent); margin-bottom: 0.5rem;">✅ Duty Found!</h3>
                                <p><strong>Teacher ID:</strong> ${m.id}</p>
                                <p><strong>Subject:</strong> ${m.exam}</p>
                                <p><strong>Block:</strong> ${m.block} | <strong>Time:</strong> ${m.time}</p>
                                <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                                    <button onclick="printTeacherSlip('${m.id}', '${m.block}', '${m.date}', '${m.time}', '${m.exam}')" class="btn btn-sm">🖨️ Print Duty</button>
                                    <button onclick="showOnMap('${m.block}', [${m.coords}])" class="btn btn-sm" style="background:var(--primary);">📍 View Block on Map</button>
                                </div>
                            </div>
                        `;
                    } else {
                        alert(`✅ Duty Found for ID ${m.id} in ${m.block} Block. Check the printed slip!`);
                    }

                    teacherSearchQuery.value = '';
                } else {
                    if (teacherSearchResults) {
                        teacherSearchResults.innerHTML = `<p class="alert alert-error" style="background: rgba(53, 234, 21, 0.2); backdrop-filter: blur(10px);">${json.message || 'Teacher not found.'}</p>`;
                    } else {
                        alert(json.message || "Teacher not found in the duty list.");
                    }
                }
            } catch (err) {
                if (teacherSearchResults) {
                    teacherSearchResults.innerHTML = '<p class="alert alert-error">Failed to connect to search server.</p>';
                } else {
                    alert("Failed to connect to the search server.");
                }
            } finally {
                btnSearchTeacher.textContent = 'Find & Print';
                btnSearchTeacher.disabled = false;
            }
        });
    }
});
