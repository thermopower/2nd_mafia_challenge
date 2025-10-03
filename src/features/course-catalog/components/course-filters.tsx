"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  COURSE_CATEGORIES,
  COURSE_DIFFICULTIES,
  COURSE_SORT_OPTIONS,
  DEFAULT_FILTERS,
} from "@/features/course-catalog/constants/filters";

type CourseFiltersProps = {
  onFiltersChange: (filters: {
    search: string;
    category?: string;
    difficulty?: string;
    sortBy: string;
  }) => void;
};

export const CourseFilters = ({ onFiltersChange }: CourseFiltersProps) => {
  const [search, setSearch] = useState<string>(DEFAULT_FILTERS.search);
  const [category, setCategory] = useState<string | undefined>(
    DEFAULT_FILTERS.category
  );
  const [difficulty, setDifficulty] = useState<string | undefined>(
    DEFAULT_FILTERS.difficulty
  );
  const [sortBy, setSortBy] = useState<string>(DEFAULT_FILTERS.sortBy);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearchSubmit = () => {
    onFiltersChange({ search, category, difficulty, sortBy });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleCategoryChange = (value: string) => {
    const newCategory = value === "all" ? undefined : value;
    setCategory(newCategory);
    onFiltersChange({ search, category: newCategory, difficulty, sortBy });
  };

  const handleDifficultyChange = (value: string) => {
    const newDifficulty = value === "all" ? undefined : value;
    setDifficulty(newDifficulty);
    onFiltersChange({ search, category, difficulty: newDifficulty, sortBy });
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    onFiltersChange({ search, category, difficulty, sortBy: value });
  };

  const handleReset = () => {
    setSearch(DEFAULT_FILTERS.search);
    setCategory(DEFAULT_FILTERS.category);
    setDifficulty(DEFAULT_FILTERS.difficulty);
    setSortBy(DEFAULT_FILTERS.sortBy);
    onFiltersChange({
      search: DEFAULT_FILTERS.search,
      category: DEFAULT_FILTERS.category,
      difficulty: DEFAULT_FILTERS.difficulty,
      sortBy: DEFAULT_FILTERS.sortBy,
    });
  };

  const hasActiveFilters = search || category || difficulty;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="코스 검색..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <Select value={category ?? "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {COURSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={difficulty ?? "all"}
            onValueChange={handleDifficultyChange}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="난이도" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 난이도</SelectItem>
              {COURSE_DIFFICULTIES.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_SORT_OPTIONS.map((sort) => (
                <SelectItem key={sort.value} value={sort.value}>
                  {sort.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">필터:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              검색: {search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearch("");
                  onFiltersChange({ search: "", category, difficulty, sortBy });
                }}
              />
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="gap-1">
              {COURSE_CATEGORIES.find((c) => c.value === category)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setCategory(undefined);
                  onFiltersChange({
                    search,
                    category: undefined,
                    difficulty,
                    sortBy,
                  });
                }}
              />
            </Badge>
          )}
          {difficulty && (
            <Badge variant="secondary" className="gap-1">
              {COURSE_DIFFICULTIES.find((d) => d.value === difficulty)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setDifficulty(undefined);
                  onFiltersChange({
                    search,
                    category,
                    difficulty: undefined,
                    sortBy,
                  });
                }}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset}>
            초기화
          </Button>
        </div>
      )}
    </div>
  );
};
