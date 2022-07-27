import type { NextPage } from "next";
import Head from "next/head";
import { useReducer } from "react";
import cn from "classnames";
import cloneDeep from "lodash/cloneDeep";

type Square = {
	isBlack: boolean;
	num: number | null;
	letter: string;
};

const initSquares: Square[] = Array(225);
for (let i = 0; i < 225; i++) {
	const blankSquare = { isBlack: false, num: null, letter: " " };
	initSquares.push(blankSquare);
}

const squareReducer = (state: Square[], action: any) => {
	switch (action.type) {
		case "reset": {
			return initSquares;
		}
		default:
			throw new Error("That's not something you can do.");
	}
};

const Editor: NextPage = () => {
	const [squares, setSquares] = useReducer(squareReducer, initSquares);

	return (
		<>
			<Head>
				<title>Editor</title>
				<meta name="description" content="Edit crosswords" />
				{/* <link rel="icon" href="/favicon.ico" /> */}
			</Head>

			<main className="container mx-auto h-screen p-4">
				<Board squares={squares}></Board>
				<Dashboard></Dashboard>
			</main>
		</>
	);
};

type BoardProps = {
	squares: Square[];
};

const Board = ({ squares }: BoardProps) => {
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
			{squares.map((square, index) => {
				return (
					<div key={index}>
						<p className="absolute text-[10px] p-0 ml-[0.1rem]"></p>
						<button className={getSquareStyle(index)}></button>
					</div>
				);
			})}
		</div>
	);
};

const Dashboard = () => {
	return <></>;
};

export default Editor;
