import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
      <button
        className="btn btn--secondary btn--sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ minWidth: '80px' }}
      >
        السابق
      </button>

      <div style={{ display: 'flex', gap: '4px' }}>
        {pages.map((page) => (
          <button
            key={page}
            className={`btn btn--sm ${currentPage === page ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => onPageChange(page)}
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '8px' }}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className="btn btn--secondary btn--sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ minWidth: '80px' }}
      >
        التالي
      </button>
    </div>
  );
}
