import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useReducer, useState } from "react";
import cn from "classnames";
import cloneDeep from "lodash/cloneDeep";
import { useMouseState } from "../utils/useMouseState";
import { type } from "os";
import { isBoolean } from "lodash";

// Visual state ----------------------------------------------------------------
type Square = {
	isBlack: boolean;
	num: number | null;
	letter: string;
};

const initSquares: Square[] = [];
for (let i = 0; i < 225; i++) {
	const blankSquare: Square = { isBlack: false, num: null, letter: " " };
	initSquares.push(blankSquare);
}

type SquareReducerActionTypes =
	| { type: "toggleColor"; payload: { id: number } }
	| { type: "changeNumber"; payload: { id: number; newNum: number } }
	| { type: "changeLetter"; payload: { id: number; newLetter: string } }
	| { type: "reset" };

const squareReducer = (state: Square[], action: SquareReducerActionTypes) => {
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
		case "changeLetter": {
			const newState = cloneDeep(state);
			const { id, newLetter } = action.payload;

			newState[id]!.letter = newLetter;
			return newState;
		}
		case "reset": {
			return initSquares;
		}
	}
};

// Main ------------------------------------------------------------------------
function Editor(): JSX.Element {
	const { isMouseDown } = useMouseState();

	const [squares, setSquares] = useReducer(squareReducer, initSquares);
	const [editorMode, setEditorMode] = useState("Color");
	const [targetColor, setTargetColor] = useState(false);

	//TODO Colors skip squares when the mouse moves too fast.
	const handleMouseEvent = (id: number, click: boolean) => {
		if (editorMode === "Color") {
			const square = squares[id];

			if (click) setTargetColor(!square?.isBlack);

			const isOppColor = square?.isBlack !== targetColor;

			if (click || (isMouseDown && isOppColor)) {
				setSquares({ type: "toggleColor", payload: { id } });
			}
		}
	};

	const handleDashboardEvent = (type: "reset" | "numbers") => {
		if (type === "reset") {
			setSquares({ type: "reset" });
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
	};

	return (
		<>
			<Head>
				<title>Editor</title>
				<meta name="description" content="Edit crosswords" />
				{/* <link rel="icon" href="/favicon.ico" /> */}
			</Head>

			<main className="container mx-auto h-screen flex justify-center p-4">
				<div className="flex items-center justify-center">
					<Board squares={squares} handleMouseEvent={handleMouseEvent}></Board>
					<div className="w-8"></div>
					<Dashboard handleDashboardEvent={handleDashboardEvent}></Dashboard>
				</div>
			</main>
		</>
	);
}

// Board -----------------------------------------------------------------------
type BoardProps = {
	squares: Square[];
	handleMouseEvent: (id: number, click: boolean) => void;
};

function Board({ squares, handleMouseEvent }: BoardProps) {
	const getSquareStyle = (i: number) => {
		return cn({
			"w-full h-full outline outline-1 outline-black font-bold": true,
			"bg-white": !squares[i]?.isBlack,
			"bg-black": squares[i]?.isBlack,
			// "bg-blue-300": i === selectedSquare,
			// "bg-blue-100": false,
		});
	};

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
							{square.letter}
						</button>
					</div>
				);
			})}
		</div>
	);
}

// Dashboard -------------------------------------------------------------------
type DashboardProps = {
	handleDashboardEvent: (type: "reset" | "numbers") => void;
};

function Dashboard({ handleDashboardEvent }: DashboardProps) {
	return (
		<div className="w-[500px] h-[300px] flex justify-center items-center border border-black border-solid shadow">
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
			</div>
		</div>
	);
}

export default Editor;
