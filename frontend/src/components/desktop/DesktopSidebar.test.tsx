import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DesktopSidebar from "./DesktopSidebar";

describe("DesktopSidebar", () => {
  let observe: ResizeObserverCallback | undefined;

  beforeEach(() => {
    HTMLElement.prototype.scrollBy = vi.fn();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    globalThis.ResizeObserver = vi.fn(function ResizeObserverMock(callback: ResizeObserverCallback) {
      observe = callback;
      return {
        disconnect: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
      };
    }) as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    observe = undefined;
  });

  it("renders horizontal scroll structure for compact menu access", () => {
    render(<DesktopSidebar />);

    expect(screen.getByLabelText("메뉴 스크롤 영역")).toHaveClass("w-full");
    expect(screen.getByLabelText("메뉴 스크롤 영역")).toHaveClass("overflow-hidden");
    expect(screen.getByLabelText("주요 메뉴 목록")).toHaveClass("overflow-x-auto");
    expect(screen.getByLabelText("주요 메뉴 목록")).toHaveClass("whitespace-nowrap");
  });

  it("hides scroll controls when the menu fully fits", async () => {
    render(<DesktopSidebar />);
    mockMenuWidths({ scrollWidth: 600, clientWidth: 600 });

    observe?.([], {} as ResizeObserver);

    await waitFor(() => {
      expect(screen.queryByLabelText("메뉴 오른쪽으로 스크롤")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("메뉴 왼쪽으로 스크롤")).not.toBeInTheDocument();
    });
  });

  it("shows and uses scroll controls when the menu overflows", async () => {
    render(<DesktopSidebar />);
    mockMenuWidths({ scrollWidth: 900, clientWidth: 600 });

    observe?.([], {} as ResizeObserver);

    await waitFor(() => {
      expect(screen.getByLabelText("메뉴 오른쪽으로 스크롤")).toBeInTheDocument();
      expect(screen.getByLabelText("메뉴 왼쪽으로 스크롤")).toBeInTheDocument();
      expect(screen.getByLabelText("메뉴 오른쪽으로 스크롤")).toHaveClass("right-2");
    });

    fireEvent.click(screen.getByLabelText("메뉴 오른쪽으로 스크롤"));
    fireEvent.click(screen.getByLabelText("메뉴 왼쪽으로 스크롤"));

    expect(HTMLElement.prototype.scrollBy).toHaveBeenCalledWith({ left: 180, behavior: "smooth" });
    expect(HTMLElement.prototype.scrollBy).toHaveBeenCalledWith({ left: -180, behavior: "smooth" });
  });
});

function mockMenuWidths({ scrollWidth, clientWidth }: { scrollWidth: number; clientWidth: number }) {
  const menu = screen.getByLabelText("주요 메뉴 목록");

  Object.defineProperty(menu, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(menu, "clientWidth", { configurable: true, value: clientWidth });
}
