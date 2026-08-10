// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
//
// PUT YOUR SUPABASE INFORMATION HERE
//
// Supabase Dashboard
// → Project Settings
// → API
//
// DO NOT USE THE SERVICE_ROLE KEY.
// USE THE PUBLIC ANON/PUBLISHABLE KEY.
//

const SUPABASE_URL =
    "YOUR_SUPABASE_URL";


const SUPABASE_ANON_KEY =
    "YOUR_SUPABASE_ANON_KEY";


// ============================================================
// CREATE SUPABASE CLIENT
// ============================================================

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let documents = [];

let signatoryList = [];

let editingDocumentId = null;


// ============================================================
// PAGE START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        resetSignatories();

        await loadDocuments();

    }
);


// ============================================================
// OPEN ADD MODAL
// ============================================================

function openAddModal() {

    editingDocumentId = null;


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add Document";


    document.getElementById(
        "saveButton"
    ).textContent =
        "Save Document";


    clearForm();


    document.getElementById(
        "modal"
    ).classList.add("show");

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    document.getElementById(
        "modal"
    ).classList.remove("show");

}


// ============================================================
// RESET SIGNATORIES
// ============================================================

function resetSignatories() {

    signatoryList = [

        {
            name: "",

            signed: false,

            signedAt: "",

            receivedBy: "",

            receivedAt: ""

        }

    ];


    renderSignatories();

}


// ============================================================
// ADD SIGNATORY
// ============================================================

function addSignatory() {

    signatoryList.push({

        name: "",

        signed: false,

        signedAt: "",

        receivedBy: "",

        receivedAt: ""

    });


    renderSignatories();

}


// ============================================================
// REMOVE SIGNATORY
// ============================================================

function removeSignatory(index) {

    if (
        signatoryList.length <= 1
    ) {

        alert(
            "At least one signatory is required."
        );

        return;

    }


    signatoryList.splice(
        index,
        1
    );


    renderSignatories();

}


// ============================================================
// RENDER SIGNATORIES
// ============================================================

function renderSignatories() {

    const container =
        document.getElementById(
            "signatoryContainer"
        );


    container.innerHTML = "";


    signatoryList.forEach(
        function (person, index) {


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "signatory";


            row.innerHTML = `

                <div class="signatory-number">
                    ${index + 1}
                </div>


                <input
                    type="text"
                    placeholder="Signatory name"
                    value="${escapeHTML(
                        person.name
                    )}"
                    onchange="
                        updatePerson(
                            ${index},
                            'name',
                            this.value
                        )
                    "
                >


                <input
                    type="datetime-local"
                    value="${toDateTimeLocal(
                        person.signedAt
                    )}"
                    onchange="
                        updatePerson(
                            ${index},
                            'signedAt',
                            this.value
                        )
                    "
                >


                <input
                    type="text"
                    placeholder="Received by"
                    value="${escapeHTML(
                        person.receivedBy
                    )}"
                    onchange="
                        updatePerson(
                            ${index},
                            'receivedBy',
                            this.value
                        )
                    "
                >


                <input
                    type="datetime-local"
                    value="${toDateTimeLocal(
                        person.receivedAt
                    )}"
                    onchange="
                        updatePerson(
                            ${index},
                            'receivedAt',
                            this.value
                        )
                    "
                >


                <label class="signed-box">

                    <input
                        type="checkbox"
                        ${
                            person.signed
                                ? "checked"
                                : ""
                        }

                        onchange="
                            toggleSigned(
                                ${index},
                                this.checked
                            )
                        "
                    >

                    Signed

                </label>


                <button
                    type="button"
                    class="remove-signatory"
                    onclick="
                        removeSignatory(
                            ${index}
                        )
                    "
                >
                    ×
                </button>

            `;


            container.appendChild(row);

        }
    );

}


// ============================================================
// UPDATE PERSON
// ============================================================

function updatePerson(
    index,
    field,
    value
) {

    signatoryList[index][field] =
        value;

}


// ============================================================
// SIGNED CHECKBOX
// ============================================================

function toggleSigned(
    index,
    checked
) {

    signatoryList[index].signed =
        checked;


    if (checked) {

        /*
         * If signed checkbox is checked
         * and there is no date/time,
         * automatically set current date/time.
         */

        if (
            !signatoryList[index].signedAt
        ) {

            signatoryList[index].signedAt =
                new Date().toISOString();

        }

    }

    else {

        /*
         * Unchecked means NOT SIGNED.
         */

        signatoryList[index].signedAt =
            "";

    }


    renderSignatories();

}


// ============================================================
// SAVE DOCUMENT
// ============================================================

async function saveDocument() {

    // --------------------------------------------------------
    // GET FORM VALUES
    // --------------------------------------------------------

    const documentDate =
        document.getElementById(
            "documentDate"
        ).value;


    const documentName =
        document.getElementById(
            "documentName"
        ).value.trim();


    const schoolYear =
        document.getElementById(
            "schoolYear"
        ).value.trim();


    const semester =
        document.getElementById(
            "semester"
        ).value;


    const trustedBy =
        document.getElementById(
            "trustedBy"
        ).value.trim();


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!documentDate) {

        alert(
            "Please select the document date."
        );

        return;

    }


    if (!documentName) {

        alert(
            "Please enter the document name."
        );

        return;

    }


    if (!schoolYear) {

        alert(
            "Please enter the school year."
        );

        return;

    }


    if (!semester) {

        alert(
            "Please select the semester."
        );

        return;

    }


    if (
        signatoryList.length === 0
    ) {

        alert(
            "Please add at least one signatory."
        );

        return;

    }


    for (
        const person
        of signatoryList
    ) {

        if (
            !person.name.trim()
        ) {

            alert(
                "Please enter all signatory names."
            );

            return;

        }

    }


    // --------------------------------------------------------
    // DISABLE BUTTON
    // --------------------------------------------------------

    const saveButton =
        document.getElementById(
            "saveButton"
        );


    saveButton.disabled = true;


    saveButton.textContent =
        "Saving...";


    try {


        // ====================================================
        // EDIT EXISTING DOCUMENT
        // ====================================================

        if (editingDocumentId) {


            // -----------------------------------------------
            // UPDATE DOCUMENT
            // -----------------------------------------------

            const {
                error: documentError
            } = await supabaseClient

                .from("documents")

                .update({

                    document_date:
                        documentDate,

                    document_name:
                        documentName,

                    school_year:
                        schoolYear,

                    semester:
                        semester,

                    trusted_by:
                        trustedBy

                })

                .eq(
                    "id",
                    editingDocumentId
                );


            if (documentError) {

                throw documentError;

            }


            // -----------------------------------------------
            // DELETE OLD SIGNATORIES
            // -----------------------------------------------

            const {
                error: deleteError
            } = await supabaseClient

                .from("signatories")

                .delete()

                .eq(
                    "document_id",
                    editingDocumentId
                );


            if (deleteError) {

                throw deleteError;

            }


            // -----------------------------------------------
            // INSERT UPDATED SIGNATORIES
            // -----------------------------------------------

            const signatories =
                createSignatoryRows(
                    editingDocumentId
                );


            const {
                error: signatoryError
            } = await supabaseClient

                .from("signatories")

                .insert(signatories);


            if (signatoryError) {

                throw signatoryError;

            }


            alert(
                "Document updated successfully!"
            );

        }


        // ====================================================
        // ADD NEW DOCUMENT
        // ====================================================

        else {


            // -----------------------------------------------
            // INSERT DOCUMENT
            // -----------------------------------------------

            const {
                data: document,
                error: documentError
            } = await supabaseClient

                .from("documents")

                .insert({

                    document_date:
                        documentDate,

                    document_name:
                        documentName,

                    school_year:
                        schoolYear,

                    semester:
                        semester,

                    trusted_by:
                        trustedBy

                })

                .select()

                .single();


            if (documentError) {

                throw documentError;

            }


            // -----------------------------------------------
            // INSERT SIGNATORIES
            // -----------------------------------------------

            const signatories =
                createSignatoryRows(
                    document.id
                );


            const {
                error: signatoryError
            } = await supabaseClient

                .from("signatories")

                .insert(signatories);


            if (signatoryError) {

                throw signatoryError;

            }


            alert(
                "Document saved successfully!"
            );

        }


        // ----------------------------------------------------
        // FINISH
        // ----------------------------------------------------

        closeModal();

        clearForm();

        await loadDocuments();


    }

    catch (error) {

        console.error(
            "DATABASE ERROR:",
            error
        );


        alert(
            "Database error:\n\n" +
            error.message
        );

    }

    finally {

        saveButton.disabled =
            false;


        saveButton.textContent =
            editingDocumentId
                ? "Update Document"
                : "Save Document";

    }

}


// ============================================================
// CREATE SIGNATORY DATABASE ROWS
// ============================================================

function createSignatoryRows(
    documentId
) {

    return signatoryList.map(
        function (person) {

            return {

                document_id:
                    documentId,

                signatory_name:
                    person.name.trim(),

                signed_at:
                    person.signed

                        ? (
                            person.signedAt
                                ? new Date(
                                    person.signedAt
                                ).toISOString()

                                : new Date()
                                    .toISOString()
                          )

                        : null,

                received_by:
                    person.receivedBy.trim()
                    || null,

                received_at:
                    person.receivedAt

                        ? new Date(
                            person.receivedAt
                        ).toISOString()

                        : null

            };

        }
    );

}


// ============================================================
// LOAD DOCUMENTS
// ============================================================

async function loadDocuments() {

    try {


        const {
            data,
            error
        } = await supabaseClient

            .from("documents")

            .select(`
                *,
                signatories (*)
            `)

            .order(
                "document_date",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        documents =
            data || [];


        renderDocuments();

        updateStatistics();


    }

    catch (error) {

        console.error(
            "LOAD ERROR:",
            error
        );


        alert(
            "Unable to load documents:\n\n" +
            error.message
        );

    }

}


// ============================================================
// GET STATUS
// ============================================================

function getStatus(document) {

    const signatories =
        document.signatories || [];


    // No signatories

    if (
        signatories.length === 0
    ) {

        return "PENDING";

    }


    // EVERYONE SIGNED

    const allSigned =
        signatories.every(
            function (person) {

                return !!person.signed_at;

            }
        );


    if (allSigned) {

        return "COMPLETED";

    }


    // AT LEAST ONE SIGNED

    const atLeastOneSigned =
        signatories.some(
            function (person) {

                return !!person.signed_at;

            }
        );


    if (atLeastOneSigned) {

        return "FOR SIGNATURE";

    }


    // NOBODY SIGNED

    return "PENDING";

}


// ============================================================
// RENDER DOCUMENTS
// ============================================================

function renderDocuments() {

    const table =
        document.getElementById(
            "documentTable"
        );


    const search =
        document.getElementById(
            "searchInput"
        )
        .value
        .toLowerCase();


    const filter =
        document.getElementById(
            "statusFilter"
        )
        .value;


    table.innerHTML = "";


    // --------------------------------------------------------
    // FILTER
    // --------------------------------------------------------

    const filtered =
        documents.filter(
            function (doc) {


                const documentName =
                    (
                        doc.document_name
                        || ""
                    )
                    .toLowerCase();


                const matchesSearch =
                    documentName.includes(
                        search
                    );


                const status =
                    getStatus(doc);


                const matchesStatus =
                    filter === "ALL"
                    ||
                    status === filter;


                return (
                    matchesSearch
                    &&
                    matchesStatus
                );

            }
        );


    // --------------------------------------------------------
    // EMPTY
    // --------------------------------------------------------

    if (
        filtered.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    No documents found.

                </td>

            </tr>

        `;

        return;

    }


    // --------------------------------------------------------
    // DOCUMENT ROWS
    // --------------------------------------------------------

    filtered.forEach(
        function (doc) {


            const row =
                document.createElement(
                    "tr"
                );


            const status =
                getStatus(doc);


            const signatories =
                doc.signatories || [];


            // ================================================
            // SIGNATORY HTML
            // ================================================

            const signatoryHTML =
                signatories.map(
                    function (person) {


                        if (
                            person.signed_at
                        ) {

                            return `

                                <div
                                    class="table-person"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            person.signatory_name
                                        )}
                                    </strong>

                                    <br>

                                    <span
                                        class="
                                            status
                                            completed
                                        "
                                    >
                                        SIGNED
                                    </span>

                                    <br>

                                    <small>

                                        Signed:
                                        ${formatDateTime(
                                            person.signed_at
                                        )}

                                    </small>

                                </div>

                                <hr>

                            `;

                        }


                        return `

                            <div
                                class="table-person"
                            >

                                <strong>
                                    ${escapeHTML(
                                        person.signatory_name
                                    )}
                                </strong>

                                <br>

                                <span
                                    class="
                                        status
                                        pending
                                    "
                                >
                                    NOT SIGNED
                                </span>

                            </div>

                            <hr>

                        `;

                    }
                ).join("");


            // ================================================
            // RECEIVED HTML
            // ================================================

            const receivedHTML =
                signatories.map(
                    function (person) {


                        return `

                            <div>

                                <strong>
                                    ${
                                        person.received_by
                                            ? escapeHTML(
                                                person.received_by
                                            )
                                            : "-"
                                    }
                                </strong>


                                ${
                                    person.received_at

                                    ? `

                                        <br>

                                        <small>

                                            Received:
                                            ${formatDateTime(
                                                person.received_at
                                            )}

                                        </small>

                                      `

                                    : ""

                                }

                            </div>

                            <hr>

                        `;

                    }
                ).join("");


            // ================================================
            // STATUS CLASS
            // ================================================

            let statusClass =
                "pending";


            if (
                status === "COMPLETED"
            ) {

                statusClass =
                    "completed";

            }

            else if (
                status === "FOR SIGNATURE"
            ) {

                statusClass =
                    "signature";

            }


            // ================================================
            // ROW
            // ================================================

            row.innerHTML = `

                <td>

                    ${formatDate(
                        doc.document_date
                    )}

                </td>


                <td>

                    <strong>

                        ${escapeHTML(
                            doc.document_name
                        )}

                    </strong>

                </td>


                <td>

                    ${escapeHTML(
                        doc.school_year
                        || "-"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        doc.semester
                        || "-"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        doc.trusted_by
                        || "-"
                    )}

                </td>


                <td>

                    ${signatoryHTML}

                </td>


                <td>

                    ${receivedHTML}

                </td>


                <td>

                    <span
                        class="
                            status
                            ${statusClass}
                        "
                    >

                        ${status}

                    </span>

                </td>


                <td>

                    <button
                        class="edit-btn"
                        onclick="
                            editDocument(
                                ${doc.id}
                            )
                        "
                    >

                        Edit

                    </button>


                    <button
                        class="delete-btn"
                        onclick="
                            deleteDocument(
                                ${doc.id}
                            )
                        "
                    >

                        Delete

                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}


// ============================================================
// EDIT DOCUMENT
// ============================================================

function editDocument(id) {

    const doc =
        documents.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!doc) {

        alert(
            "Document not found."
        );

        return;

    }


    // --------------------------------------------------------
    // SET EDIT MODE
    // --------------------------------------------------------

    editingDocumentId =
        id;


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Document";


    document.getElementById(
        "saveButton"
    ).textContent =
        "Update Document";


    // --------------------------------------------------------
    // LOAD DOCUMENT
    // --------------------------------------------------------

    document.getElementById(
        "documentDate"
    ).value =
        doc.document_date || "";


    document.getElementById(
        "documentName"
    ).value =
        doc.document_name || "";


    document.getElementById(
        "schoolYear"
    ).value =
        doc.school_year || "";


    document.getElementById(
        "semester"
    ).value =
        doc.semester || "";


    document.getElementById(
        "trustedBy"
    ).value =
        doc.trusted_by || "";


    // --------------------------------------------------------
    // LOAD SIGNATORIES
    // --------------------------------------------------------

    signatoryList =
        (
            doc.signatories
            || []
        )
        .map(
            function (person) {

                return {

                    name:
                        person.signatory_name
                        || "",

                    signed:
                        !!person.signed_at,

                    signedAt:
                        person.signed_at
                        || "",

                    receivedBy:
                        person.received_by
                        || "",

                    receivedAt:
                        person.received_at
                        || ""

                };

            }
        );


    // --------------------------------------------------------
    // FALLBACK
    // --------------------------------------------------------

    if (
        signatoryList.length === 0
    ) {

        resetSignatories();

    }

    else {

        renderSignatories();

    }


    // --------------------------------------------------------
    // OPEN
    // --------------------------------------------------------

    document.getElementById(
        "modal"
    ).classList.add("show");

}


// ============================================================
// DELETE DOCUMENT
// ============================================================

async function deleteDocument(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this document?"
        );


    if (!confirmed) {

        return;

    }


    try {


        const {
            error
        } = await supabaseClient

            .from("documents")

            .delete()

            .eq(
                "id",
                id
            );


        if (error) {

            throw error;

        }


        alert(
            "Document deleted successfully."
        );


        await loadDocuments();


    }

    catch (error) {

        console.error(
            "DELETE ERROR:",
            error
        );


        alert(
            "Delete failed:\n\n" +
            error.message
        );

    }

}


// ============================================================
// CLEAR FORM
// ============================================================

function clearForm() {

    document.getElementById(
        "documentDate"
    ).value = "";


    document.getElementById(
        "documentName"
    ).value = "";


    document.getElementById(
        "schoolYear"
    ).value = "";


    document.getElementById(
        "semester"
    ).value = "";


    document.getElementById(
        "trustedBy"
    ).value = "";


    resetSignatories();

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date) {

    if (!date) {

        return "-";

    }


    const d =
        new Date(
            date + "T00:00:00"
        );


    if (
        isNaN(
            d.getTime()
        )
    ) {

        return date;

    }


    return d.toLocaleDateString(
        "en-GB"
    );

}


// ============================================================
// FORMAT DATE + TIME
// ============================================================

function formatDateTime(date) {

    if (!date) {

        return "-";

    }


    const d =
        new Date(date);


    if (
        isNaN(
            d.getTime()
        )
    ) {

        return "-";

    }


    return d.toLocaleString(
        "en-GB"
    );

}


// ============================================================
// DATETIME LOCAL FORMAT
// ============================================================

function toDateTimeLocal(value) {

    if (!value) {

        return "";

    }


    const d =
        new Date(value);


    if (
        isNaN(
            d.getTime()
        )
    ) {

        return "";

    }


    function pad(number) {

        return String(number)
            .padStart(2, "0");

    }


    return (

        d.getFullYear()

        + "-"

        + pad(
            d.getMonth() + 1
        )

        + "-"

        + pad(
            d.getDate()
        )

        + "T"

        + pad(
            d.getHours()
        )

        + ":"

        + pad(
            d.getMinutes()
        )

    );

}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics() {

    let pending = 0;

    let signature = 0;

    let completed = 0;


    documents.forEach(
        function (doc) {


            const status =
                getStatus(doc);


            if (
                status === "PENDING"
            ) {

                pending++;

            }

            else if (
                status === "FOR SIGNATURE"
            ) {

                signature++;

            }

            else if (
                status === "COMPLETED"
            ) {

                completed++;

            }

        }
    );


    document.getElementById(
        "totalCount"
    ).textContent =
        documents.length;


    document.getElementById(
        "pendingCount"
    ).textContent =
        pending;


    document.getElementById(
        "signatureCount"
    ).textContent =
        signature;


    document.getElementById(
        "completedCount"
    ).textContent =
        completed;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
