import Head from "next/head";
import { useReducer, useState } from "react";
import cn from "classnames";
import cloneDeep from "lodash/cloneDeep";
import clone from "lodash/clone";
import { useMouseState } from "../utils/useMouseState";

//TODO set up next auth and prisma db stuff to hopefully get rid of the slowness.

// Helper functions that can be exported someday -------------------------------
function isSingleLetter(c: string) {
	// https://stackoverflow.com/questions/9862761/how-to-check-if-character-is-a-letter-in-javascript
	// credit: mik01aj
	return c.toLowerCase() !== c.toUpperCase() && c.length === 1;
}

// Visual state ----------------------------------------------------------------
const initLetters: string[] = Array(225).fill(" ");

type Square = {
	isBlack: boolean;
	num: number | null;
};

const initSquares: Square[] = [];
for (let i = 0; i < 225; i++) {
	const blankSquare: Square = { isBlack: false, num: null };
	initSquares.push(blankSquare);
}

type SquareReducerActionTypes =
	| { type: "toggleColor"; payload: { id: number } }
	| { type: "changeNumber"; payload: { id: number; newNum: number } }
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
		case "changeNumber": {
			const newState = cloneDeep(state);
			const { id, newNum } = action.payload;

			newState[id]!.num = newNum;
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
	const [letters, setLetters] = useState(initLetters);
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

	function handleKeyboardEvent(e: React.KeyboardEvent<HTMLDivElement>) {
		// Help functions that should prob be moved somewhere else someday.
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

		if (selectedSquare === null) return;

		if (isSingleLetter(e.key)) {
			const newLetters = clone(letters);
			newLetters[selectedSquare] = e.key.toUpperCase();
			setLetters(newLetters);

			setSelectedSquare(findNextSquare());
		} else if (e.key === "Tab") {
			e.preventDefault();
		} else if (e.key === "Backspace") {
			const newLetters = clone(letters);
			newLetters[selectedSquare] = " "; // empty square
			setLetters(newLetters);

			setSelectedSquare(findPrevSquare());
		}
	}

	function handleDashboardEvent(type: "reset" | "numbers" | "mode") {
		if (type === "reset") {
			setSquares({ type: "reset" });
			setEditorMode("Color");
			setSelectedSquare(null);
		}

		if (type === "numbers") {
			// Regenerate numbers on the board
			let currNum = 1;

			for (let id = 0; id < 225; id++) {
				if (squares[id]?.isBlack) continue;

				const onTopEdge = id < 15 || squares[id - 15]?.isBlack;
				const onLeftEdge = id % 15 === 0 || squares[id - 1]?.isBlack;

				if (onTopEdge || onLeftEdge) {
					setSquares({
						type: "changeNumber",
						payload: { id, newNum: currNum },
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

			<main className="container mx-auto h-screen flex justify-center p-4">
				<div
					className="flex items-center justify-center"
					onKeyDown={(e) => handleKeyboardEvent(e)}
				>
					<Board
						squares={squares}
						letters={letters}
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
	letters: string[];
	selectedSquare: number | null;
	handleMouseEvent: (id: number, click: boolean) => void;
};

function Board({
	squares,
	letters,
	selectedSquare,
	handleMouseEvent,
}: BoardProps) {
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
		<div className="w-[450px] h-[450px] grid grid-cols-15">
			{squares.map((square, id) => {
				return (
					<div key={id}>
						<p className="absolute text-[10px] p-0 ml-[0.1rem]">{square.num}</p>
						<button
							className={getSquareStyle(id)}
							onMouseDown={() => handleMouseEvent(id, true)}
							onMouseOver={() => handleMouseEvent(id, false)}
						>
							{letters[id]}
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
					className="p-1 border-t border-l border-solid border-black"
					onClick={() => setWindow("Controls")}
				>
					Controls
				</button>
				<button
					className="p-1 border-t border-l border-r border-black"
					onClick={() => setWindow("Words")}
				>
					{/* figure out these borders	*/}
					Words
				</button>
			</div>
			{window === "Controls" && (
				<div className="w-[500px] h-[300px] flex justify-center items-center border border-black border-solid shadow-lg">
					<div className="text-xl font-quicksand flex">
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
			<div className="w-[500px] h-[300px] py-3 flex flex-col items-center overflow-y-scroll border border-black border-solid shadow-lg">
				<div className="w-full px-3 py-1 flex justify-between">
					<span>1</span>

					<span>PIZZA</span>
					<input
						type={"text"}
						className="w-[16rem] border border-solid border-black focus:outline-none"
					></input>
				</div>
				<div className="w-full px-3 py-1 flex justify-between">
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
