/**
 * Test Suite for Kruskal's MST Algorithm
 * Validates the correctness of the implementation
 */

// Test Configuration
const TEST_RESULTS = {
    passed: 0,
    failed: 0,
    tests: []
};

// ========== HELPER FUNCTIONS ==========

/**
 * Assert that a condition is true
 * @param {boolean} condition - The condition to check
 * @param {string} message - Description of the test
 */
function assert(condition, message) {
    if (condition) {
        TEST_RESULTS.passed++;
        console.log(`✅ PASS: ${message}`);
        TEST_RESULTS.tests.push({ status: 'PASS', message });
    } else {
        TEST_RESULTS.failed++;
        console.error(`❌ FAIL: ${message}`);
        TEST_RESULTS.tests.push({ status: 'FAIL', message });
    }
}

/**
 * Assert two values are equal
 * @param {*} actual - Actual value
 * @param {*} expected - Expected value
 * @param {string} message - Test description
 */
function assertEqual(actual, expected, message) {
    assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

/**
 * Run a test suite
 * @param {string} suiteName - Name of the test suite
 * @param {function} testFn - Test function to run
 */
function runTestSuite(suiteName, testFn) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Running Test Suite: ${suiteName}`);
    console.log(`${'='.repeat(50)}`);
    testFn();
}

/**
 * Reset global state for clean tests
 */
function resetState() {
    numVertices = 0;
    numEdges = 0;
    edgesData = [];
    mstEdges = [];
    rejectedEdges = [];
    parentArr = [];
}

// ========== UNION-FIND TESTS ==========

function testUnionFind() {
    runTestSuite('Union-Find Data Structure', () => {
        // Test 1: Initialize
        resetState();
        numVertices = 5;
        parentArr = [];
        for (let i = 0; i < numVertices; i++) parentArr[i] = i;
        
        assertEqual(parentArr[0], 0, 'Parent of 0 should be 0');
        assertEqual(parentArr[4], 4, 'Parent of 4 should be 4');
        
        // Test 2: Find operation
        let root = find(2);
        assertEqual(root, 2, 'Find should return 2 for element 2');
        
        // Test 3: Union operation
        unionSet(0, 1);
        assert(find(0) === find(1), 'After union(0,1), find(0) should equal find(1)');
        
        // Test 4: Path compression
        unionSet(1, 2);
        let root2 = find(2);
        let root0 = find(0);
        assertEqual(root2, root0, 'Path compression should work correctly');
        
        // Test 5: Count components
        resetState();
        numVertices = 4;
        parentArr = [];
        for (let i = 0; i < numVertices; i++) parentArr[i] = i;
        
        assertEqual(countComponents(), 4, 'Should have 4 components initially');
        unionSet(0, 1);
        assertEqual(countComponents(), 3, 'Should have 3 components after one union');
        unionSet(2, 3);
        assertEqual(countComponents(), 2, 'Should have 2 components after two unions');
        unionSet(1, 2);
        assertEqual(countComponents(), 1, 'Should have 1 component when all are connected');
    });
}

// ========== ALGORITHM TESTS ==========

function testKruskalAlgorithm() {
    runTestSuite('Kruskal\'s Algorithm', () => {
        // Test 1: Simple 3-vertex graph
        resetState();
        numVertices = 3;
        edgesData = [
            { u: 0, v: 1, weight: 1 },
            { u: 1, v: 2, weight: 2 },
            { u: 0, v: 2, weight: 3 }
        ];
        
        // Sort edges
        edgesData.sort((a, b) => a.weight - b.weight);
        
        // Initialize
        parentArr = [];
        for (let i = 0; i < numVertices; i++) parentArr[i] = i;
        
        mstEdges = [];
        rejectedEdges = [];
        let totalCost = 0;
        
        // Run algorithm
        for (let edge of edgesData) {
            if (find(edge.u) !== find(edge.v)) {
                unionSet(edge.u, edge.v);
                mstEdges.push(edge);
                totalCost += edge.weight;
            } else {
                rejectedEdges.push(edge);
            }
        }
        
        assertEqual(mstEdges.length, 2, 'MST should have 2 edges for 3 vertices');
        assertEqual(totalCost, 3, 'Minimum cost should be 3');
        assertEqual(rejectedEdges.length, 1, 'Should reject 1 edge (forms cycle)');
        
        // Test 2: Disconnected graph (should find MSF)
        resetState();
        numVertices = 4;
        edgesData = [
            { u: 0, v: 1, weight: 1 },
            { u: 2, v: 3, weight: 2 }
        ];
        
        parentArr = [];
        for (let i = 0; i < numVertices; i++) parentArr[i] = i;
        
        mstEdges = [];
        rejectedEdges = [];
        totalCost = 0;
        
        for (let edge of edgesData) {
            if (find(edge.u) !== find(edge.v)) {
                unionSet(edge.u, edge.v);
                mstEdges.push(edge);
                totalCost += edge.weight;
            } else {
                rejectedEdges.push(edge);
            }
        }
        
        assertEqual(mstEdges.length, 2, 'Should accept all edges for disconnected graph');
        assertEqual(totalCost, 3, 'Total cost should be 3');
        
        // Test 3: Complete graph K4
        resetState();
        numVertices = 4;
        edgesData = [
            { u: 0, v: 1, weight: 1 },
            { u: 0, v: 2, weight: 4 },
            { u: 0, v: 3, weight: 3 },
            { u: 1, v: 2, weight: 2 },
            { u: 1, v: 3, weight: 5 },
            { u: 2, v: 3, weight: 6 }
        ];
        
        edgesData.sort((a, b) => a.weight - b.weight);
        
        parentArr = [];
        for (let i = 0; i < numVertices; i++) parentArr[i] = i;
        
        mstEdges = [];
        rejectedEdges = [];
        totalCost = 0;
        
        for (let edge of edgesData) {
            if (find(edge.u) !== find(edge.v)) {
                unionSet(edge.u, edge.v);
                mstEdges.push(edge);
                totalCost += edge.weight;
            } else {
                rejectedEdges.push(edge);
            }
        }
        
        assertEqual(mstEdges.length, 3, 'MST should have 3 edges for 4 vertices');
        assertEqual(totalCost, 6, 'Minimum cost should be 6 (1+2+3 - sorted order gives smallest weights)');
    });
}

// ========== INPUT VALIDATION TESTS ==========

function testInputValidation() {
    runTestSuite('Input Validation', () => {
        // Test 1: Invalid vertices count
        let errors = validateInput(1, 5);
        assert(errors.length > 0, 'Should reject vertices < 2');
        assert(errors[0].includes('at least 2'), 'Error message should be clear');
        
        // Test 2: Valid vertices
        errors = validateInput(5, 5);
        assert(errors.length === 0, 'Should accept valid vertices count');
        
        // Test 3: Vertices too high
        errors = validateInput(13, 5);
        assert(errors.length > 0, 'Should reject vertices > 12');
        
        // Test 4: Invalid edges count
        errors = validateInput(5, 0);
        assert(errors.length > 0, 'Should reject edges < 1');
        
        // Test 5: Edges exceed maximum for graph
        errors = validateInput(3, 50);
        assert(errors.length > 0, 'Should reject edges > max for graph');
        // For 3 vertices: max edges = 3*2/2 = 3
        
        // Test 6: Edge values as NaN
        errors = validateInput(NaN, 5);
        assert(errors.length > 0, 'Should reject NaN vertices');
        
        errors = validateInput(5, NaN);
        assert(errors.length > 0, 'Should reject NaN edges');
    });
}

// ========== EDGE CASE TESTS ==========

function testEdgeCases() {
    runTestSuite('Edge Cases', () => {
        // Test 1: Minimum valid graph (2 vertices, 1 edge)
        resetState();
        numVertices = 2;
        edgesData = [{ u: 0, v: 1, weight: 10 }];
        
        parentArr = [0, 1];
        mstEdges = [];
        rejectedEdges = [];
        
        for (let edge of edgesData) {
            if (find(edge.u) !== find(edge.v)) {
                unionSet(edge.u, edge.v);
                mstEdges.push(edge);
            }
        }
        
        assertEqual(mstEdges.length, 1, 'Should accept single edge in minimal graph');
        
        // Test 2: Duplicate edges (same endpoints)
        resetState();
        numVertices = 3;
        edgesData = [
            { u: 0, v: 1, weight: 1 },
            { u: 0, v: 1, weight: 5 }, // Duplicate with different weight
            { u: 1, v: 2, weight: 2 }
        ];
        
        edgesData.sort((a, b) => a.weight - b.weight);
        parentArr = [0, 1, 2];
        mstEdges = [];
        rejectedEdges = [];
        
        for (let edge of edgesData) {
            if (find(edge.u) !== find(edge.v)) {
                unionSet(edge.u, edge.v);
                mstEdges.push(edge);
            } else {
                rejectedEdges.push(edge);
            }
        }
        
        assert(rejectedEdges.length > 0, 'Should reject duplicate edge');
        
        // Test 3: All edges same weight
        resetState();
        numVertices = 3;
        edgesData = [
            { u: 0, v: 1, weight: 5 },
            { u: 1, v: 2, weight: 5 },
            { u: 0, v: 2, weight: 5 }
        ];
        
        parentArr = [0, 1, 2];
        mstEdges = [];
        rejectedEdges = [];
        
        for (let edge of edgesData) {
            if (find(edge.u) !== find(edge.v)) {
                unionSet(edge.u, edge.v);
                mstEdges.push(edge);
            }
        }
        
        assertEqual(mstEdges.length, 2, 'Should select correct number of edges even with same weights');
    });
}

// ========== MAIN TEST RUNNER ==========

function runAllTests() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     Kruskal\'s MST Algorithm - Test Suite        ║');
    console.log('╚══════════════════════════════════════════════════╝');
    
    // Run all test suites
    testUnionFind();
    testKruskalAlgorithm();
    testInputValidation();
    testEdgeCases();
    
    // Print summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('TEST SUMMARY');
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Passed: ${TEST_RESULTS.passed}`);
    console.log(`❌ Failed: ${TEST_RESULTS.failed}`);
    console.log(`📊 Total: ${TEST_RESULTS.passed + TEST_RESULTS.failed}`);
    console.log(`Success Rate: ${((TEST_RESULTS.passed / (TEST_RESULTS.passed + TEST_RESULTS.failed)) * 100).toFixed(1)}%`);
    console.log(`${'='.repeat(50)}\n`);
    
    return {
        passed: TEST_RESULTS.passed,
        failed: TEST_RESULTS.failed,
        total: TEST_RESULTS.passed + TEST_RESULTS.failed,
        successRate: ((TEST_RESULTS.passed / (TEST_RESULTS.passed + TEST_RESULTS.failed)) * 100).toFixed(1),
        details: TEST_RESULTS.tests
    };
}

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, assert, assertEqual };
}
