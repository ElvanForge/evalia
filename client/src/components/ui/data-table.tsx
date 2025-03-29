import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: string;
    cell?: (item: T) => React.ReactNode;
  }[];
  pageSize?: number;
  searchPlaceholder?: string;
  searchKey?: string;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  searchPlaceholder = "Search...",
  searchKey,
  actions,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data based on search query if searchKey is provided
  const filteredData = searchKey
    ? data.filter((item) => {
        // If searchKey is 'lastName', also check 'firstName' since some students might not have lastName
        if (searchKey === 'lastName') {
          const lastName = (item as any)['lastName'] || '';
          const firstName = (item as any)['firstName'] || '';
          return (
            (lastName && lastName.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (firstName && firstName.toString().toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        
        // Regular search on the specified key
        const value = (item as any)[searchKey];
        return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    : data;

  // Calculate pagination values
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Generate pagination numbers
  const pageNumbers = [];
  const maxPageNumbers = 5;
  const ellipsis = "...";

  if (totalPages <= maxPageNumbers) {
    // Show all pages if totalPages <= maxPageNumbers
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Show a subset of pages with ellipsis if needed
    if (currentPage <= 3) {
      // If near the start, show first 4 pages + ellipsis + last page
      for (let i = 1; i <= 4; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push(ellipsis);
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // If near the end, show first page + ellipsis + last 4 pages
      pageNumbers.push(1);
      pageNumbers.push(ellipsis);
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // If in the middle, show first page + ellipsis + currentPage-1, currentPage, currentPage+1 + ellipsis + last page
      pageNumbers.push(1);
      pageNumbers.push(ellipsis);
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push(ellipsis);
      pageNumbers.push(totalPages);
    }
  }

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, itemIndex) => (
                <TableRow key={itemIndex}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={columnIndex}>
                      {column.cell
                        ? column.cell(item)
                        : (item as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right">{actions(item)}</TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>

            {pageNumbers.map((pageNumber, index) => (
              <PaginationItem key={index}>
                {pageNumber === ellipsis ? (
                  <span className="px-2">...</span>
                ) : (
                  <PaginationLink
                    isActive={pageNumber === currentPage}
                    onClick={() => goToPage(pageNumber as number)}
                  >
                    {pageNumber}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  goToPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
