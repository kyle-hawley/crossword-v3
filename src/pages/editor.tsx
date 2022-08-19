import Head from "next/head";
import { useReducer, useState } from "react";
import cn from "classnames";
import cloneDeep from "lodash/cloneDeep";
import { useMouseState } from "../utils/useMouseState";

//TODO set up next auth and prisma db stuff to hopefully get rid of the slowness.

// Helper functions that can be exported someday -------------------------------
function isSingleLetter(c: string) {
	// https://stackoverflow.com/questions/9862761/how-to-check-if-character-is-a-letter-in-javascript
	// credit: mik01aj
	return c.toLowerCase() !== c.toUpperCase() && c.length === 1;
}

// Visual state ----------------------------------------------------------------
type Square = {
	isBlack: boolean;
	num: number | null;
	acrossNum: number | null;
	downNum: number | null;
	letter: string;
};

const initSquares: Square[] = [];
for (let i = 0; i < 225; i++) {
	const blankSquare: Square = {
		isBlack: false,
		num: null,
		acrossNum: null,
		downNum: null,
		letter: " ",
	};
	initSquares.push(blankSquare);
}

type SquareReducerActionTypes =
	| { type: "toggleColor"; payload: { id: number } }
	| {
			type: "setNum";
			payload: { id: number; newNum: number; across: boolean; down: boolean };
	  }
	| { type: "setLetter"; payload: { id: number; newLetter: string } }
	| { type: "reset" };

function squareReducer(state: Square[], action: SquareReducerActionTypes) {
	switch (action.type) {
		case "toggleColor": {
			const newState = cloneDeep(state);
			const { id } = action.payload;

			newState[id]!.isBlack = !state[id]?.isBlack;

			if (id !== 112) {
				newState[224 - id]!.isBlack = !state[224 - id]?.isBlack;
			}

			return newState;
		}
		case "setNum": {
			const newState = cloneDeep(state);
			const { id, newNum, across, down } = action.payload;

			newState[id]!.num = newNum;

			if (across) {
				for (let i = 0; i < 15 - (id % 15); i++) {
					if (newState[id + i]?.isBlack) break;
					newState[id + i]!.acrossNum = newNum;
				}
			}

			// if (down) {
			// 	for (let i = 0; i < 225; i + 15) {
			// 		if (newState[id + i]?.isBlack) break;
			// 		if (id + i > 224) break;

			// 		newState[id + i]!.downNum = newNum;
			// 	}
			// }

			return newState;
		}
		case "setLetter": {
			const newState = cloneDeep(state);
			const { id, newLetter } = action.payload;

			newState[id]!.letter = newLetter;
			return newState;
		}
		case "reset": {
			return initSquares;
		}
	}
}

// Main ------------------------------------------------------------------------
function Editor(): JSX.Element {
	const { isMouseDown } = useMouseState();

	const [squares, setSquares] = useReducer(squareReducer, initSquares);
	const [editorMode, setEditorMode] = useState<"Color" | "Words">("Color");
	const [targetColor, setTargetColor] = useState(false);

	const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
	const [fillDir, setFillDir] = useState<"across" | "down">("across");

	//TODO Colors skip squares when the mouse moves too fast.
	function handleMouseEvent(id: number, click: boolean) {
		if (editorMode === "Color") {
			const square = squares[id];

			if (click) setTargetColor(!square?.isBlack);

			const isOppColor = square?.isBlack !== targetColor;

			if (click || (isMouseDown && isOppColor)) {
				setSquares({ type: "toggleColor", payload: { id } });
			}
		}

		if (editorMode === "Words" && click) {
			setSelectedSquare(id);
		}
	}

	// Helper functions that should prob be moved somewhere else someday----------
	function findNextSquare() {
		if (fillDir === "across") {
			let currId = selectedSquare! + 1;
			while (true) {
				if (currId > 224) currId = 0;
				if (!squares[currId]?.isBlack) return currId;
				currId++;
			}
		}
		if (fillDir === "down") {
			// do the next thing
		}
		return null; // making typescript happy
	}

	function findPrevSquare() {
		if (fillDir === "across") {
			let currId = selectedSquare! - 1;
			while (true) {
				if (currId < 0) currId = 224;
				if (!squares[currId]?.isBlack) return currId;
				currId--;
			}
		}
		return null; // making typescript happy
	}
	//----------------------------------------------------------------------------

	function handleKeyboardEvent(e: React.KeyboardEvent<HTMLDivElement>) {
		if (selectedSquare === null) return;

		if (isSingleLetter(e.key)) {
			setSquares({
				type: "setLetter",
				payload: { id: selectedSquare, newLetter: e.key.toUpperCase() },
			});
			setSelectedSquare(findNextSquare());
		} else if (e.key === "Backspace") {
			setSquares({
				type: "setLetter",
				payload: { id: selectedSquare, newLetter: " " },
			});
			setSelectedSquare(findPrevSquare());
		} else if (e.key === "Tab") {
			e.preventDefault();
		}
	}

	function handleDashboardEvent(type: "reset" | "numbers" | "mode") {
		if (type === "reset") {
			setSquares({ type: "reset" });
			setEditorMode("Color");
			setSelectedSquare(null);
		}

		if (type === "numbers") {
			// Generate numbers on the board
			let currNum = 1;

			for (let id = 0; id < 225; id++) {
				if (squares[id]?.isBlack) continue;

				const onTopEdge = id < 15 || squares[id - 15]?.isBlack;
				const onLeftEdge = id % 15 === 0 || squares[id - 1]?.isBlack;

				if (onTopEdge || onLeftEdge) {
					setSquares({
						type: "setNum",
						payload: {
							id,
							newNum: currNum,
							across: onLeftEdge === true,
							down: onTopEdge === true,
						},
					});

					currNum++;
				}
			}
		}

		if (type === "mode") {
			if (editorMode === "Color") {
				setEditorMode("Words");
				// Find the first nonblack square.
				for (let id = 0; id < 225; id++) {
					if (squares[id]?.isBlack) continue;
					setSelectedSquare(id);
					break;
				}
			} else if (editorMode === "Words") {
				setEditorMode("Color");
				setSelectedSquare(null);
			}
		}
	}

	return (
		<>
			<Head>
				<title>Editor</title>
				<meta name="description" content="Edit crosswords" />
				{/* <link rel="icon" href="/favicon.ico" /> */}
			</Head>

			<main className="container mx-auto flex h-screen justify-center p-4">
				<div
					className="flex items-center justify-center"
					onKeyDown={(e) => handleKeyboardEvent(e)}
				>
					<Board
						squares={squares}
						selectedSquare={selectedSquare}
						handleMouseEvent={handleMouseEvent}
					></Board>

					<div className="w-8"></div>
					<Dashboard
						editorMode={editorMode}
						handleDashboardEvent={handleDashboardEvent}
					></Dashboard>
				</div>
			</main>
		</>
	);
}

// Board -----------------------------------------------------------------------
type BoardProps = {
	squares: Square[];
	selectedSquare: number | null;
	handleMouseEvent: (id: number, click: boolean) => void;
};

function Board({ squares, selectedSquare, handleMouseEvent }: BoardProps) {
	function getSquareStyle(id: number) {
		return cn({
			"w-full h-full align-top outline outline-1 outline-black font-bold": true,
			"bg-white": !squares[id]?.isBlack,
			"bg-black": squares[id]?.isBlack,
			"bg-blue-300": id === selectedSquare,
			// "bg-blue-100": false,
		});
	}

	return (
		<div className="grid h-[450px] w-[450px] grid-cols-15">
			{squares.map((square, id) => {
				return (
					<div key={id}>
						<p className="absolute ml-[0.1rem] p-0 text-[10px]">{square.num}</p>
						<button
							className={getSquareStyle(id)}
							onMouseDown={() => handleMouseEvent(id, true)}
							onMouseOver={() => handleMouseEvent(id, false)}
						>
							{id}
						</button>
					</div>
				);
			})}
		</div>
	);
}

// Dashboard -------------------------------------------------------------------
type DashboardProps = {
	editorMode: string;
	handleDashboardEvent: (type: "reset" | "numbers" | "mode") => void;
};

function Dashboard({ editorMode, handleDashboardEvent }: DashboardProps) {
	const [window, setWindow] = useState<"Controls" | "Words">("Controls");

	return (
		<div className="flex flex-col">
			<div>
				<button
					className="border-t border-l border-solid border-black p-1"
					onClick={() => setWindow("Controls")}
				>
					Controls
				</button>
				<button
					className="border-t border-l border-r border-black p-1"
					onClick={() => setWindow("Words")}
				>
					{/* figure out these borders	*/}
					Words
				</button>
			</div>
			{window === "Controls" && (
				<div className="flex h-[300px] w-[500px] items-center justify-center border border-solid border-black shadow-lg">
					<div className="flex font-quicksand text-xl">
						<button
							className="border-b border-gray-700"
							onClick={() => handleDashboardEvent("reset")}
						>
							Reset
						</button>
						<div className="w-5"></div>
						<button
							className="border-b border-gray-700"
							onClick={() => handleDashboardEvent("numbers")}
						>
							Add Numbers
						</button>
						<div className="w-5"></div>
						<button
							className="border-b border-gray-700"
							onClick={() => handleDashboardEvent("mode")}
						>
							{editorMode}
						</button>
					</div>
				</div>
			)}
			<div className="flex h-[300px] w-[500px] flex-col items-center overflow-y-scroll border border-solid border-black py-3 shadow-lg">
				<div className="flex w-full justify-between px-3 py-1">
					<span>1</span>

					<span>PIZZA</span>
					<input
						type={"text"}
						className="w-[16rem] border border-solid border-black focus:outline-none"
					></input>
				</div>
				<div className="flex w-full justify-between px-3 py-1">
					<span>2</span>

					<span>GERONIMOAAAAAAA</span>
					<input
						type={"text"}
						className="w-[16rem] border border-solid border-black focus:outline-none"
					></input>
				</div>
			</div>
		</div>
		// Window
	);
}

export default Editor;
