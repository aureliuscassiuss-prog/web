import { useState } from 'react';
import { BRANCHES, YEARS, getSubjectsByBranchAndYear } from '../data/academicStructure';
import { ChevronRight, BookOpen, FileText } from 'lucide-react';

interface BrowseByBranchProps {
    onFilterChange: (filters: { branch?: string; year?: number; subject?: string }) => void;
}

export default function BrowseByBranch({ onFilterChange }: BrowseByBranchProps) {
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

    const handleYearSelect = (year: number) => {
        setSelectedYear(year);
        setSelectedBranch(null);
        setSelectedSubject(null);
        onFilterChange({ year });
    };

    const handleBranchSelect = (branchId: string) => {
        setSelectedBranch(branchId);
        setSelectedSubject(null);
        onFilterChange({ year: selectedYear!, branch: branchId });
    };

    const handleSubjectSelect = (subjectId: string) => {
        setSelectedSubject(subjectId);
        onFilterChange({
            year: selectedYear!,
            branch: selectedBranch!,
            subject: subjectId
        });
    };

    const subjects = selectedYear && selectedBranch
        ? getSubjectsByBranchAndYear(selectedBranch, selectedYear)
        : [];

    const selectedBranchData = BRANCHES.find(b => b.id === selectedBranch);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Browse by Academic Structure
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Year Selection */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Select Year
                    </h3>
                    <div className="space-y-2">
                        {YEARS.map((year) => (
                            <button
                                key={year}
                                onClick={() => handleYearSelect(year)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedYear === year
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Year {year}</span>
                                    {selectedYear === year && <ChevronRight className="w-4 h-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Branch Selection */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Select Branch
                    </h3>
                    {selectedYear ? (
                        <div className="space-y-2">
                            {BRANCHES.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => handleBranchSelect(branch.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedBranch === branch.id
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{branch.code}</div>
                                            <div className="text-xs opacity-75 mt-0.5">{branch.name}</div>
                                        </div>
                                        {selectedBranch === branch.id && <ChevronRight className="w-4 h-4" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Select a year first</p>
                        </div>
                    )}
                </div>

                {/* Subject Selection */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Select Subject
                    </h3>
                    {selectedBranch ? (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {subjects.map((subject) => (
                                <button
                                    key={subject.id}
                                    onClick={() => handleSubjectSelect(subject.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedSubject === subject.id
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <div>
                                        <div className="font-medium text-sm">{subject.name}</div>
                                        <div className="text-xs opacity-75 mt-0.5">{subject.code}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Select a branch first</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Path Display */}
            {(selectedYear || selectedBranch || selectedSubject) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Selected Path:</span>
                        {selectedYear && (
                            <>
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                    Year {selectedYear}
                                </span>
                                {selectedBranch && (
                                    <>
                                        <ChevronRight className="w-4 h-4" />
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                            {selectedBranchData?.code}
                                        </span>
                                    </>
                                )}
                                {selectedSubject && (
                                    <>
                                        <ChevronRight className="w-4 h-4" />
                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-medium">
                                            {subjects.find(s => s.id === selectedSubject)?.name}
                                        </span>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
