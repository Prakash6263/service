/**
 * ID Generator Utility
 * Generates IDs in format: MLBD[DEPT_CODE]-[SEQUENTIAL_NUMBER]
 * Examples: MLBDA-001, MLBDT-001, MLBDM-001
 */

// Department codes mapping
const DEPT_CODES = {
  admin: "A",
  sales_representative: "SA",
  telecaller: "T",
  sales_executive: "SE",
  manager: "M",
  accounts: "AC",
  technician: "TC",
  dispatcher: "D",
}

/**
 * Generate sequential ID in format MLBD[DEPT_CODE]-[SEQUENTIAL_NUMBER]
 * @param {string} departmentOrRole - Department code or role name
 * @param {number} sequenceNumber - Sequential number (will be padded to 3 digits)
 * @returns {string} Generated ID (e.g., MLBDA-001)
 */
function generateId(departmentOrRole, sequenceNumber) {
  if (!departmentOrRole) {
    throw new Error("Department or role is required")
  }

  if (!Number.isInteger(sequenceNumber) || sequenceNumber <= 0) {
    throw new Error("Sequence number must be a positive integer")
  }

  // Get department code
  let deptCode = departmentOrRole.toUpperCase()

  // If it's a full role name, convert to code
  if (departmentOrRole.toLowerCase() in DEPT_CODES) {
    deptCode = DEPT_CODES[departmentOrRole.toLowerCase()]
  }

  // Format: MkBD[DEPT_CODE]-[000]
  const paddedSequence = sequenceNumber.toString().padStart(3, "0")
  return `MkBD${deptCode}-${paddedSequence}`
}

/**
 * Parse a generated ID to extract department and sequence
 * @param {string} id - ID in format MLBD[DEPT_CODE]-[SEQUENTIAL_NUMBER]
 * @returns {object} { deptCode, sequenceNumber }
 */
function parseId(id) {
  const match = id.match(/^MKBD([A-Z]+)-(\d+)$/)
  if (!match) {
    throw new Error("Invalid ID format")
  }

  return {
    deptCode: match[1],
    sequenceNumber: Number.parseInt(match[2], 10),
  }
}

module.exports = {
  generateId,
  parseId,
  DEPT_CODES,
}
