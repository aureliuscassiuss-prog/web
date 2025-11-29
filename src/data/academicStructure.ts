// Medicaps University Academic Structure

export interface Subject {
    id: string;
    name: string;
    code: string;
}

export interface Branch {
    id: string;
    name: string;
    code: string;
    subjects: Record<number, Subject[]>; // year -> subjects
}

export const BRANCHES: Branch[] = [
    {
        id: 'cse',
        name: 'Computer Science & Engineering',
        code: 'CSE',
        subjects: {
            1: [
                { id: 'math1', name: 'Engineering Mathematics-I', code: 'MATH101' },
                { id: 'physics', name: 'Engineering Physics', code: 'PHY101' },
                { id: 'bee', name: 'Basic Electrical Engineering', code: 'EE101' },
                { id: 'prog1', name: 'Programming-I', code: 'CS101' },
                { id: 'graphics', name: 'Engineering Graphics', code: 'EG101' },
                { id: 'env', name: 'Environmental Science', code: 'ENV101' },
            ],
            2: [
                { id: 'math2', name: 'Engineering Mathematics-II', code: 'MATH201' },
                { id: 'ds', name: 'Data Structures', code: 'CS201' },
                { id: 'oop', name: 'Object-Oriented Programming', code: 'CS202' },
                { id: 'dcom', name: 'Data Communication', code: 'CS203' },
                { id: 'de', name: 'Digital Electronics', code: 'EC201' },
            ],
            3: [
                { id: 'dbms', name: 'Database Management Systems', code: 'CS301' },
                { id: 'os', name: 'Operating Systems', code: 'CS302' },
                { id: 'cn', name: 'Computer Networks', code: 'CS303' },
                { id: 'toc', name: 'Theory of Computation', code: 'CS304' },
                { id: 'se', name: 'Software Engineering', code: 'CS305' },
            ],
            4: [
                { id: 'ai', name: 'Artificial Intelligence', code: 'CS401' },
                { id: 'ml', name: 'Machine Learning', code: 'CS402' },
                { id: 'cc', name: 'Cloud Computing', code: 'CS403' },
                { id: 'cyber', name: 'Cyber Security', code: 'CS404' },
                { id: 'iot', name: 'Internet of Things', code: 'CS405' },
            ],
        },
    },
    {
        id: 'civil',
        name: 'Civil Engineering',
        code: 'CE',
        subjects: {
            1: [
                { id: 'math1', name: 'Engineering Mathematics-I', code: 'MATH101' },
                { id: 'physics', name: 'Engineering Physics', code: 'PHY101' },
                { id: 'bee', name: 'Basic Electrical Engineering', code: 'EE101' },
                { id: 'bce', name: 'Basic Civil Engineering', code: 'CE101' },
                { id: 'graphics', name: 'Engineering Graphics', code: 'EG101' },
                { id: 'env', name: 'Environmental Science', code: 'ENV101' },
            ],
            2: [
                { id: 'math2', name: 'Engineering Mathematics-II', code: 'MATH201' },
                { id: 'mech', name: 'Engineering Mechanics', code: 'CE201' },
                { id: 'survey', name: 'Surveying', code: 'CE202' },
                { id: 'materials', name: 'Construction Materials', code: 'CE203' },
                { id: 'fluid', name: 'Fluid Mechanics', code: 'CE204' },
            ],
            3: [
                { id: 'struct', name: 'Structural Analysis', code: 'CE301' },
                { id: 'geo', name: 'Geotechnical Engineering', code: 'CE302' },
                { id: 'trans', name: 'Transportation Engineering', code: 'CE303' },
                { id: 'enveng', name: 'Environmental Engineering', code: 'CE304' },
                { id: 'cad', name: 'Computer-Aided Design', code: 'CE305' },
            ],
            4: [
                { id: 'smart', name: 'Smart City Planning', code: 'CE401' },
                { id: 'const', name: 'Construction Management', code: 'CE402' },
                { id: 'earth', name: 'Earthquake Engineering', code: 'CE403' },
                { id: 'water', name: 'Water Resources Engineering', code: 'CE404' },
                { id: 'design', name: 'Structural Design', code: 'CE405' },
            ],
        },
    },
    {
        id: 'mechanical',
        name: 'Mechanical Engineering',
        code: 'ME',
        subjects: {
            1: [
                { id: 'math1', name: 'Engineering Mathematics-I', code: 'MATH101' },
                { id: 'physics', name: 'Engineering Physics', code: 'PHY101' },
                { id: 'bee', name: 'Basic Electrical Engineering', code: 'EE101' },
                { id: 'bme', name: 'Basic Mechanical Engineering', code: 'ME101' },
                { id: 'graphics', name: 'Engineering Graphics', code: 'EG101' },
                { id: 'env', name: 'Environmental Science', code: 'ENV101' },
            ],
            2: [
                { id: 'math2', name: 'Engineering Mathematics-II', code: 'MATH201' },
                { id: 'mech', name: 'Engineering Mechanics', code: 'ME201' },
                { id: 'thermo', name: 'Thermodynamics', code: 'ME202' },
                { id: 'fluid', name: 'Fluid Dynamics', code: 'ME203' },
                { id: 'mateng', name: 'Materials Engineering', code: 'ME204' },
            ],
            3: [
                { id: 'heat', name: 'Heat Transfer', code: 'ME301' },
                { id: 'mdesign', name: 'Machine Design', code: 'ME302' },
                { id: 'mfg', name: 'Manufacturing Processes', code: 'ME303' },
                { id: 'cim', name: 'Computer Integrated Manufacturing', code: 'ME304' },
                { id: 'rac', name: 'Refrigeration & Air Conditioning', code: 'ME305' },
            ],
            4: [
                { id: 'robot', name: 'Robotics', code: 'ME401' },
                { id: 'mecha', name: 'Mechatronics', code: 'ME402' },
                { id: 'addmfg', name: 'Additive Manufacturing', code: 'ME403' },
                { id: 'mlmfg', name: 'Machine Learning in Manufacturing', code: 'ME404' },
                { id: 'proddesign', name: 'Product Design and Development', code: 'ME405' },
            ],
        },
    },
    {
        id: 'ece',
        name: 'Electronics & Communication Engineering',
        code: 'ECE',
        subjects: {
            1: [
                { id: 'math1', name: 'Engineering Mathematics-I', code: 'MATH101' },
                { id: 'physics', name: 'Engineering Physics', code: 'PHY101' },
                { id: 'bee', name: 'Basic Electrical Engineering', code: 'EE101' },
                { id: 'bec', name: 'Basic Electronics', code: 'EC101' },
                { id: 'graphics', name: 'Engineering Graphics', code: 'EG101' },
                { id: 'env', name: 'Environmental Science', code: 'ENV101' },
            ],
            2: [
                { id: 'math2', name: 'Engineering Mathematics-II', code: 'MATH201' },
                { id: 'circuit', name: 'Circuit Theory', code: 'EC201' },
                { id: 'de', name: 'Digital Electronics', code: 'EC202' },
                { id: 'signals', name: 'Signals and Systems', code: 'EC203' },
                { id: 'edevices', name: 'Electronic Devices', code: 'EC204' },
            ],
            3: [
                { id: 'analog', name: 'Analog Electronics', code: 'EC301' },
                { id: 'comm', name: 'Communication Systems', code: 'EC302' },
                { id: 'micro', name: 'Microprocessors', code: 'EC303' },
                { id: 'control', name: 'Control Systems', code: 'EC304' },
                { id: 'vlsi', name: 'VLSI Design', code: 'EC305' },
            ],
            4: [
                { id: 'embed', name: 'Embedded Systems', code: 'EC401' },
                { id: 'wireless', name: 'Wireless Communication', code: 'EC402' },
                { id: 'dsp', name: 'Digital Signal Processing', code: 'EC403' },
                { id: 'iot', name: 'Internet of Things', code: 'EC404' },
                { id: 'optical', name: 'Optical Communication', code: 'EC405' },
            ],
        },
    },
    {
        id: 'ee',
        name: 'Electrical Engineering',
        code: 'EE',
        subjects: {
            1: [
                { id: 'math1', name: 'Engineering Mathematics-I', code: 'MATH101' },
                { id: 'physics', name: 'Engineering Physics', code: 'PHY101' },
                { id: 'bee', name: 'Basic Electrical Engineering', code: 'EE101' },
                { id: 'bec', name: 'Basic Electronics', code: 'EC101' },
                { id: 'graphics', name: 'Engineering Graphics', code: 'EG101' },
                { id: 'env', name: 'Environmental Science', code: 'ENV101' },
            ],
            2: [
                { id: 'math2', name: 'Engineering Mathematics-II', code: 'MATH201' },
                { id: 'circuit', name: 'Circuit Theory', code: 'EE201' },
                { id: 'emf', name: 'Electromagnetic Fields', code: 'EE202' },
                { id: 'machines1', name: 'Electrical Machines-I', code: 'EE203' },
                { id: 'measure', name: 'Electrical Measurements', code: 'EE204' },
            ],
            3: [
                { id: 'machines2', name: 'Electrical Machines-II', code: 'EE301' },
                { id: 'power', name: 'Power Systems', code: 'EE302' },
                { id: 'control', name: 'Control Systems', code: 'EE303' },
                { id: 'pe', name: 'Power Electronics', code: 'EE304' },
                { id: 'micro', name: 'Microprocessors', code: 'EE305' },
            ],
            4: [
                { id: 'smart', name: 'Smart Grid Technology', code: 'EE401' },
                { id: 'renewable', name: 'Renewable Energy Systems', code: 'EE402' },
                { id: 'drives', name: 'Electric Drives', code: 'EE403' },
                { id: 'hvdc', name: 'HVDC Transmission', code: 'EE404' },
                { id: 'prot', name: 'Power System Protection', code: 'EE405' },
            ],
        },
    },
];

export const YEARS = [1, 2, 3, 4];

export function getBranchById(id: string): Branch | undefined {
    return BRANCHES.find(b => b.id === id);
}

export function getSubjectsByBranchAndYear(branchId: string, year: number): Subject[] {
    const branch = getBranchById(branchId);
    return branch?.subjects[year] || [];
}
